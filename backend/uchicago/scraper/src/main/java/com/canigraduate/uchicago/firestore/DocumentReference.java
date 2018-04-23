package com.canigraduate.uchicago.firestore;

import com.canigraduate.uchicago.firestore.models.Document;
import com.google.common.collect.Streams;
import com.google.gson.JsonObject;
import org.apache.http.client.methods.HttpGet;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class DocumentReference {
    private final String name;
    private final CollectionReference parent;

    DocumentReference(CollectionReference parent, String name) {
        this.parent = parent;
        this.name = name;
    }

    String getName() {
        return this.name;
    }

    String getUrl() throws UnsupportedEncodingException {
        return this.parent.getUrl() + "/" + URLEncoder.encode(this.name, "UTF-8");
    }

    String getPath() {
        return this.parent.getPath() + "/" + this.name;
    }

    public CollectionReference getParent() {
        return this.parent;
    }

    public CollectionReference collection(String name) {
        return new CollectionReference(this, name);
    }

    private Iterable<String> collectionIds() {
        return FirestoreService.listCollectionIds(this);
    }

    public List<CollectionReference> collections() {
        return Streams.stream(this.collectionIds())
                .map(id -> new CollectionReference(this, id))
                .collect(Collectors.toList());
    }

    public void delete() {
        FirestoreService.delete(this);
    }

    public Optional<Document> get() {
        return this.get(null);
    }

    public Optional<Document> get(String transaction) {
        try {
            String url = this.getUrl();
            if (transaction != null) {
                url += "?transaction=" + URLEncoder.encode(transaction, "UTF-8");
            }
            JsonObject response = FirestoreService.execute(new HttpGet(url));
            if (response.has("error") && response.getAsJsonObject("error").get("code").getAsInt() == 404) {
                return Optional.empty();
            }
            return Optional.of(new Document(response));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
