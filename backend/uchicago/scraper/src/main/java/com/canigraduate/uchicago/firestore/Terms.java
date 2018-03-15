package com.canigraduate.uchicago.firestore;

import com.canigraduate.uchicago.deserializers.TermDeserializer;
import com.canigraduate.uchicago.firestore.models.Document;
import com.canigraduate.uchicago.firestore.models.Write;
import com.canigraduate.uchicago.models.Term;
import com.canigraduate.uchicago.serializers.TermSerializer;
import com.google.common.collect.ImmutableList;
import com.google.gson.JsonObject;

import java.util.Optional;

public class Terms {
    private final CollectionReference root;
    private final String course;

    public Terms(String course) {
        this.course = course;
        this.root = FirestoreService.getUChicago().collection("courses").document(course).collection("terms");
    }

    public void delete(String term) {
        root.document(term).delete();
    }

    public Iterable<String> list() {
        return root.documentIds();
    }

    public Optional<Term> get(String course) {
        return get(course, null);
    }

    private Optional<Term> get(String term, String transaction) {
        return root.document(term).get(transaction).map(Document::getFields).map(TermDeserializer::fromMapValue);
    }

    public JsonObject set(Term term) {
        return FirestoreService.commit(ImmutableList.of(new Write().setUpdate(
                new Document().setFields(TermSerializer.toMapValue(term))
                        .setName("courses/" + this.course + "/terms/" + term.getTerm()))));
    }
}
