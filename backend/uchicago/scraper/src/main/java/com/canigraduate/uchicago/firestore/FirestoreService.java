package com.canigraduate.uchicago.firestore;

import com.canigraduate.uchicago.ServiceAccountCredentials;
import com.canigraduate.uchicago.firestore.models.Document;
import com.canigraduate.uchicago.firestore.models.Write;
import com.google.common.collect.EvictingQueue;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Iterables;
import com.google.common.collect.Streams;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.apache.http.HttpEntity;
import org.apache.http.client.methods.*;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.http.protocol.HTTP;
import org.apache.http.util.EntityUtils;

import java.io.*;
import java.net.URLEncoder;
import java.util.Iterator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.zip.GZIPOutputStream;

public class FirestoreService {
    private static final ServiceAccountCredentials CREDENTIALS = new ServiceAccountCredentials(
            "https://www.googleapis.com/auth/datastore", "https://www.googleapis.com/auth/devstorage.full_control");
    private static final String FIRESTORE_URL = "https://firestore.googleapis.com/v1beta1/";
    private static final CloseableHttpClient HTTP_CLIENT = HttpClients.custom()
            .setConnectionManager(getConnectionManager())
            .build();
    private static DocumentReference UCHICAGO = new CollectionReference(null, "institutions").document("uchicago");

    public static String getBasePath() {
        return "projects/canigraduate-43286/databases/(default)/documents";
    }

    public static String getBaseUrl() {
        return FIRESTORE_URL + getBasePath();
    }

    public static String getUChicagoPath() {
        return getBasePath() + "/" + UCHICAGO.getPath();
    }

    public static String getUChicagoUrl() {
        return FIRESTORE_URL + getUChicagoPath();
    }

    public static DocumentReference getUChicago() {
        return UCHICAGO;
    }

    private static PoolingHttpClientConnectionManager getConnectionManager() {
        PoolingHttpClientConnectionManager cm = new PoolingHttpClientConnectionManager();
        cm.setDefaultMaxPerRoute(256);
        cm.setMaxTotal(256);
        return cm;
    }

    /**
     * Used only for testing.
     **/
    public static void setUChicago(DocumentReference ref) {
        UCHICAGO = ref;
    }

    static JsonObject execute(HttpUriRequest request) {
        return execute(request, true);
    }

    private static JsonObject execute(HttpUriRequest request, boolean retry) {
        request.addHeader(CREDENTIALS.getAuthorizationHeader());
        try (CloseableHttpResponse response = HTTP_CLIENT.execute(request)) {
            HttpEntity entity = response.getEntity();
            try (Reader in = new InputStreamReader(entity.getContent())) {
                JsonParser parser = new JsonParser();
                JsonObject obj = parser.parse(in).getAsJsonObject();
                EntityUtils.consume(entity);
                if (obj.has("error")) {
                    JsonObject err = obj.getAsJsonObject("error");
                    if (err.get("code").getAsInt() == 401 && err.get("status")
                            .getAsString()
                            .equals("UNAUTHENTICATED")) {
                        throw new RuntimeException("Error from server: " + obj.toString());
                    } else if (err.get("code").getAsInt() == 404) {
                        return obj;
                    } else {
                        throw new RuntimeException("Error from server: " + obj.toString());
                    }
                }
                return obj;
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    static void delete(DocumentReference doc) {
        doc.collections().forEach(FirestoreService::delete);
        // Delete the immediate document.
        try {
            execute(new HttpDelete(doc.getUrl()));
        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        }
    }

    static void delete(CollectionReference collection) {
        List<DocumentReference> documents;
        do {
            documents = collection.documents();
            JsonObject response = FirestoreService.commit(documents.stream()
                    .map(doc -> new Write().setDelete(getBasePath() + "/" + doc.getPath()))
                    .collect(Collectors.toList()));
            documents.forEach(doc -> doc.collections().forEach(FirestoreService::delete));
            if (response.has("error")) {
                throw new RuntimeException(response.get("message").getAsString());
            }
        } while (!documents.isEmpty());
    }

    static Iterable<String> listCollectionIds(DocumentReference doc) {
        try {
            String url = getBaseUrl() + ":listCollectionIds?parent=" + URLEncoder.encode(
                    getBasePath() + "/" + doc.getPath(), "UTF-8");
            ImmutableList.Builder<String> builder = new ImmutableList.Builder<>();
            Optional.ofNullable(execute(new HttpPost(url)).getAsJsonArray("collectionIds"))
                    .ifPresent(array -> array.forEach(id -> builder.add(id.getAsString())));
            return builder.build();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    static Iterable<String> listDocumentIds(CollectionReference collection) {
        return listDocumentIds(collection, null);
    }

    static Iterable<String> listDocumentIds(CollectionReference collection, String transaction) {
        return Iterables.transform(listDocuments(collection, transaction, false), Document::getId);
    }

    static Iterable<Document> listDocuments(CollectionReference collection) {
        return listDocuments(collection, null);
    }

    static Iterable<Document> listDocuments(CollectionReference collection, String transaction) {
        return listDocuments(collection, transaction, true);
    }

    private static Iterable<Document> listDocuments(CollectionReference collection, String transaction,
                                                    boolean includeFields) {
        return () -> new Iterator<Document>() {
            boolean finished = false;
            String nextPageToken = null;
            final EvictingQueue<Document> queue = EvictingQueue.create(300);

            @Override
            public boolean hasNext() {
                if (queue.isEmpty()) {
                    repopulateQueue();
                }
                return !finished || !queue.isEmpty();
            }

            private void repopulateQueue() {
                if (finished) {
                    return;
                }
                try {
                    // Issue a new request to populate the queue.
                    String params = "pageSize=300&showMissing=true";
                    if (!includeFields) {
                        params += "&mask.fieldPaths=_";
                    }
                    if (transaction != null) {
                        params += "&transaction=" + URLEncoder.encode(transaction, "UTF-8");
                    }
                    if (nextPageToken != null) {
                        params += "&pageToken=" + URLEncoder.encode(nextPageToken, "UTF-8");
                    }
                    JsonObject obj = execute(new HttpGet(collection.getUrl() + "?" + params));
                    JsonArray documents = obj.getAsJsonArray("documents");
                    if (documents == null) {
                        finished = true;
                        return;
                    }
                    Streams.stream(documents).map(JsonElement::getAsJsonObject).map(Document::new).forEach(queue::add);
                    nextPageToken = Optional.ofNullable(obj.get("nextPageToken"))
                            .map(JsonElement::getAsString)
                            .orElse(null);
                    if (nextPageToken == null) {
                        finished = true;
                    }
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            }

            @Override
            public Document next() {
                if (!hasNext()) {
                    throw new NoSuchElementException();
                }
                if (queue.isEmpty()) {
                    repopulateQueue();
                }
                return queue.poll();
            }
        };
    }

    public static String beginTransaction() {
        return Optional.ofNullable(execute(new HttpPost(getBaseUrl() + ":beginTransaction")).get("transaction"))
                .map(JsonElement::getAsString)
                .orElseThrow(() -> new RuntimeException("Missing transaction"));
    }

    public static JsonObject commit(Iterable<Write> writes) {
        return commit(writes, null);
    }

    public static JsonObject commit(Iterable<Write> writes, String transaction) {
        JsonObject writeRequest = new JsonObject();
        JsonArray jsonWrites = new JsonArray();
        writes.forEach(write -> jsonWrites.add(write.toJsonObject()));
        writeRequest.add("writes", jsonWrites);
        if (transaction != null) {
            writeRequest.addProperty("transaction", transaction);
        }
        HttpPost request = new HttpPost(getBaseUrl() + ":commit");
        try {
            request.setEntity(new StringEntity(writeRequest.toString()));
        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        }
        // request.setHeader(HTTP.CONTENT_TYPE, "application/json");
        return execute(request);
    }

    public static JsonObject writeIndex(String name, String payload) {
        String bucket = UCHICAGO.getName();
        HttpPost request;
        try {
            request = new HttpPost(String.format("https://www.googleapis.com/upload/storage/v1/b/%s/o?name=%s", bucket,
                    URLEncoder.encode("indexes/" + name, "UTF-8")));
            request.setEntity(new StringEntity(payload));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        if (name.endsWith("json")) {
            request.setHeader(HTTP.CONTENT_TYPE, "application/json");
        } else {
            request.setHeader(HTTP.CONTENT_TYPE, "application/octet-stream");
        }
        JsonObject response = execute(request);
        System.out.println(response);
        makeReadable(name);
        return response;
    }


    private static JsonObject makeReadable(String name) {
        String bucket = UCHICAGO.getName();
        HttpPatch request;
        try {
            request = new HttpPatch(String.format("https://www.googleapis.com/storage/v1/b/%s/o/%s", bucket,
                    URLEncoder.encode("indexes/" + name, "UTF-8")));
            request.setEntity(new StringEntity("{\"acl\":[{\"entity\":\"allUsers\",\"role\":\"READER\"}]}"));
        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        }
        request.setHeader(HTTP.CONTENT_TYPE, "application/json");
        return execute(request);
    }

    private static byte[] compress(String data) throws IOException {
        try (ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream(data.length())) {
            try (GZIPOutputStream gzipOutputStream = new GZIPOutputStream(byteArrayOutputStream)) {
                gzipOutputStream.write(data.getBytes());
            }
            return byteArrayOutputStream.toByteArray();
        }
    }
}

