package com.canigraduate.uchicago.firestore;

import com.canigraduate.uchicago.firestore.models.Document;
import com.google.common.collect.Streams;

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

    public Iterable<String> documentIds() {
        return FirestoreService.listDocumentIds(this);
    }

    public Iterable<String> documentIds(String transaction) {
        return FirestoreService.listDocumentIds(this, transaction);
    }

    public Iterable<Document> allDocuments() {
        return FirestoreService.listDocuments(this);
    }

    public Iterable<Document> allDocuments(String transaction) {
        return FirestoreService.listDocuments(this, transaction);
    }

    public List<DocumentReference> documents() {
        return Streams.stream(documentIds()).map(id -> new DocumentReference(this, id)).collect(Collectors.toList());
    }
}
