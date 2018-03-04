package com.canigraduate.uchicago.firestore;

import com.canigraduate.uchicago.firestore.models.Document;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class DocumentReference {
    private final String name;
    private final CollectionReference parent;

    public DocumentReference(CollectionReference parent, String name) {
        this.parent = parent;
        this.name = name;
    }

    String getUrl() throws UnsupportedEncodingException {
        return this.parent.getUrl() + "/" + URLEncoder.encode(name, "UTF-8");
    }

    String getPath() {
        return this.parent.getPath() + "/" + name;
    }

    CollectionReference collection(String name) {
        return new CollectionReference(this, name);
    }

    private List<String> collectionIds() {
        return FirestoreService.listCollectionIds(this);
    }

    public List<CollectionReference> collections() {
        return collectionIds().stream().map(id -> new CollectionReference(this, id)).collect(Collectors.toList());
    }

    public void delete() {
        FirestoreService.delete(this);
    }

    public Optional<Document> get() {
        return get(null);
    }

    public Optional<Document> get(String transaction) {
        try {
            String url = this.getUrl();
            if (transaction != null) {
                url += "?transaction=" + URLEncoder.encode(transaction, "UTF-8");
            }
            HttpGet request = new HttpGet(url);
            request.addHeader(FirestoreService.getAuthorizationHeader());
            JsonObject response = new JsonParser().parse(
                    new InputStreamReader(new DefaultHttpClient().execute(request).getEntity().getContent()))
                    .getAsJsonObject();
            if (response.has("error") && response.getAsJsonObject("error").get("code").getAsInt() == 404) {
                return Optional.empty();
            }
            return Optional.of(new Document(response));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
