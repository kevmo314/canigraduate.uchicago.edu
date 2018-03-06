package com.canigraduate.uchicago.firestore;

import com.canigraduate.uchicago.ServiceAccountCredentials;
import com.canigraduate.uchicago.firestore.models.Document;
import com.canigraduate.uchicago.firestore.models.Write;
import com.google.common.collect.ImmutableList;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.apache.http.HttpEntity;
import org.apache.http.client.methods.*;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.protocol.HTTP;
import org.apache.http.util.EntityUtils;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class FirestoreService {
    private static final ServiceAccountCredentials CREDENTIALS = new ServiceAccountCredentials(
            ImmutableList.of("https://www.googleapis.com/auth/datastore"));
    private static final String FIRESTORE_URL = "https://firestore.googleapis.com/v1beta1/";
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

    static DocumentReference getUChicago() {
        return UCHICAGO;
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
        CloseableHttpClient httpclient = HttpClients.createDefault();
        try {
            CloseableHttpResponse response = httpclient.execute(request);
            HttpEntity entity = response.getEntity();
            Reader in = new InputStreamReader(entity.getContent());
            JsonParser parser = new JsonParser();
            JsonObject obj = parser.parse(in).getAsJsonObject();
            EntityUtils.consume(entity);
            in.close();
            response.close();
            if (obj.has("error")) {
                JsonObject err = obj.getAsJsonObject("error");
                if (err.get("code").getAsInt() == 401 && err.get("status").getAsString().equals("UNAUTHENTICATED")) {
                    throw new RuntimeException("Error from server: " + obj.toString());
                } else if (err.get("code").getAsInt() == 404) {
                    return obj;
                } else {
                    throw new RuntimeException("Error from server: " + obj.toString());
                }
            }
            return obj;
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

    static List<String> listCollectionIds(DocumentReference doc) {
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

    static List<String> listDocumentIds(CollectionReference collection) {
        return listDocumentIds(collection, null);
    }

    static List<String> listDocumentIds(CollectionReference collection, String transaction) {
        ImmutableList.Builder<String> builder = new ImmutableList.Builder<>();
        Optional<String> nextPageToken = Optional.empty();
        do {
            try {
                String params = "mask.fieldPaths=_&pageSize=500&showMissing=true";
                if (transaction != null) {
                    params += "&transaction=" + URLEncoder.encode(transaction, "UTF-8");
                }
                if (nextPageToken.isPresent()) {
                    params += "&pageToken=" + URLEncoder.encode(nextPageToken.get(), "UTF-8");
                }
                JsonObject obj = execute(new HttpGet(collection.getUrl() + "?" + params));
                Optional.ofNullable(obj.getAsJsonArray("documents"))
                        .ifPresent(array -> array.forEach(
                                doc -> builder.add(new Document(doc.getAsJsonObject()).getId())));
                nextPageToken = Optional.ofNullable(obj.get("nextPageToken")).map(JsonElement::getAsString);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        } while (nextPageToken.isPresent());
        return builder.build();
    }

    public static String beginTransaction() {
        return Optional.ofNullable(execute(new HttpPost(getBaseUrl() + ":beginTransaction")).get("transaction"))
                .map(JsonElement::getAsString)
                .orElseThrow(() -> new RuntimeException("Missing transaction"));
    }

    public static JsonObject commit(List<Write> writes) {
        return commit(writes, null);
    }

    public static JsonObject commit(List<Write> writes, String transaction) {
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
        request.setHeader(HTTP.CONTENT_TYPE, "application/json");
        return execute(request);
    }
}

