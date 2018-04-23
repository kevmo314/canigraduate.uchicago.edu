package com.canigraduate.uchicago.firestore;

import com.canigraduate.uchicago.deserializers.TermDeserializer;
import com.canigraduate.uchicago.firestore.models.*;
import com.canigraduate.uchicago.models.Term;
import com.canigraduate.uchicago.serializers.TermSerializer;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Streams;
import com.google.gson.JsonObject;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class Terms {
    private final CollectionReference root;
    private final String course;

    public Terms(String course) {
        this.course = course;
        this.root = FirestoreService.getUChicago().collection("courses").document(course).collection("terms");
    }

    public void delete(String term) {
        String transaction = FirestoreService.beginTransaction();
        List<Value> terms = this.root.getParent()
                .get(transaction)
                .flatMap(document -> document.getFields().get("terms"))
                .map(value -> value.getArray().toList().stream().map(Value::getString))
                .orElse(Stream.empty())
                .filter(element -> !element.equals(term))
                .map(Value::new)
                .collect(Collectors.toList());
        FirestoreService.commit(ImmutableList.of(
                new Write().setUpdateMask(new DocumentMask().setFieldPaths(ImmutableList.of("sections")))
                        .setUpdate(new Document().setName("courses/" + this.course)
                                .setFields(new MapValue().put("sections", new ArrayValue(terms))))), transaction);
        this.root.document(term).delete();
    }

    public Iterable<String> list() {
        return this.root.documentIds();
    }

    public Iterable<String> listFromParent() {
        return this.root.getParent()
                .get()
                .flatMap(doc -> doc.getFields().get("terms"))
                .map(value -> value.getArray().toList().stream().map(Value::getString).collect(Collectors.toList()))
                .orElse(ImmutableList.of());
    }

    public Optional<Term> get(String course) {
        return this.get(course, null);
    }

    private Optional<Term> get(String term, String transaction) {
        return this.root.document(term).get(transaction).map(Document::getFields).map(TermDeserializer::fromMapValue);
    }

    public JsonObject set(Term term) {
        MapValue fields = TermSerializer.toMapValue(term);
        return FirestoreService.commit(ImmutableList.of(
                new Write().setUpdateMask(new DocumentMask().setFieldPaths(fields.toMap().keySet()))
                        .setUpdate(new Document().setFields(fields)
                                .setName("courses/" + this.course + "/terms/" + term.getTerm()))));
    }

    public JsonObject setTermIndex(Iterable<String> terms) {
        return FirestoreService.commit(ImmutableList.of(
                new Write().setUpdateMask(new DocumentMask().setFieldPaths(ImmutableList.of("terms")))
                        .setUpdate(new Document().setName("courses/" + this.course)
                                .setFields(new MapValue().put("terms", new ArrayValue(
                                        Streams.stream(terms).map(Value::new).collect(Collectors.toList())))))));
    }

}
