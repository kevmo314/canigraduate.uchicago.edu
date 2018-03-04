package com.canigraduate.uchicago.firestore;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.List;
import java.util.stream.Collectors;

public class CollectionReference {
    private final DocumentReference parent;
    private final String name;

    public CollectionReference(DocumentReference parent, String name) {
        this.parent = parent;
        this.name = name;
    }

    String getUrl() throws UnsupportedEncodingException {
        if (this.parent != null) {
            return this.parent.getUrl() + "/" + URLEncoder.encode(name, "UTF-8");
        }
        return FirestoreService.getBaseUrl() + "/" + URLEncoder.encode(name, "UTF-8");
    }

    String getPath() {
        if (this.parent != null) {
            return this.parent.getPath() + "/" + name;
        }
        return name;
    }

    public DocumentReference document(String name) {
        return new DocumentReference(this, name);
    }

    public void delete() {
        FirestoreService.delete(this);
    }

    public List<String> documentIds() {
        return FirestoreService.listDocumentIds(this);
    }

    public List<String> documentIds(String transaction) {
        return FirestoreService.listDocumentIds(this, transaction);
    }

    public List<DocumentReference> documents() {
        return documentIds().stream().map(id -> new DocumentReference(this, id)).collect(Collectors.toList());
    }
}
