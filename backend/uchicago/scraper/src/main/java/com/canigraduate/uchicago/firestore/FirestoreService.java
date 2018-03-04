package com.canigraduate.uchicago.firestore;

import com.canigraduate.uchicago.firestore.models.Document;
import com.canigraduate.uchicago.firestore.models.Write;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.common.collect.ImmutableList;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.apache.http.Header;
import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicHeader;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class FirestoreService {
    private static final GoogleCredentials credentials = getCredentials();
    private static final String FIRESTORE_URL = "https://firestore.googleapis.com/v1beta1/";
    private static DocumentReference UCHICAGO = new CollectionReference(null, "institutions").document("uchicago");

    private static GoogleCredentials getCredentials() {
        try {
            GoogleCredentials credentials = GoogleCredentials.fromStream(
                    FirestoreService.class.getResourceAsStream("service_account_key.json"))
                    .createScoped(ImmutableList.of("https://www.googleapis.com/auth/datastore"));
            credentials.refresh();
            return credentials;
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

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

    static void delete(DocumentReference doc) {
        // Delete the immediate document.
        try {
            HttpDelete request = new HttpDelete(doc.getUrl());
            request.addHeader(getAuthorizationHeader());
            new DefaultHttpClient().execute(request);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        doc.collections().forEach(FirestoreService::delete);
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
            HttpPost request = new HttpPost(
                    getBaseUrl() + ":listCollectionIds?parent=" + URLEncoder.encode(getBasePath() + "/" + doc.getPath(),
                            "UTF-8"));
            request.addHeader(getAuthorizationHeader());
            ImmutableList.Builder builder = new ImmutableList.Builder();
            Optional.ofNullable(new JsonParser().parse(
                    new InputStreamReader(new DefaultHttpClient().execute(request).getEntity().getContent()))
                    .getAsJsonObject()
                    .getAsJsonArray("collectionIds"))
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
        try {
            String params = "mask.fieldPaths=_&pageSize=500&showMissing=true";
            if (transaction != null) {
                params += "&transaction=" + URLEncoder.encode(transaction, "UTF-8");
            }
            HttpGet request = new HttpGet(collection.getUrl() + "?" + params);
            request.addHeader(getAuthorizationHeader());
            ImmutableList.Builder builder = new ImmutableList.Builder();
            Optional.ofNullable(new JsonParser().parse(
                    new InputStreamReader(new DefaultHttpClient().execute(request).getEntity().getContent()))
                    .getAsJsonObject()
                    .getAsJsonArray("documents"))
                    .ifPresent(array -> array.forEach(doc -> builder.add(new Document(doc.getAsJsonObject()).getId())));
            return builder.build();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    static Header getAuthorizationHeader() {
        return new BasicHeader("Authorization", "Bearer " + credentials.getAccessToken().getTokenValue());
    }

    public static String beginTransaction() {
        HttpPost request = new HttpPost(getBaseUrl() + ":beginTransaction");
        request.addHeader(getAuthorizationHeader());
        try {
            return new JsonParser().parse(
                    new InputStreamReader(new DefaultHttpClient().execute(request).getEntity().getContent()))
                    .getAsJsonObject()
                    .get("transaction")
                    .getAsString();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
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
        request.addHeader(getAuthorizationHeader());
        try {
            request.setEntity(new StringEntity(writeRequest.toString()));
        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        }
        try {
            return new JsonParser().parse(
                    new InputStreamReader(new DefaultHttpClient().execute(request).getEntity().getContent()))
                    .getAsJsonObject();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}

