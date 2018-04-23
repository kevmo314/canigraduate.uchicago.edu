package com.canigraduate.uchicago.firestore;

import com.canigraduate.uchicago.deserializers.SectionDeserializer;
import com.canigraduate.uchicago.firestore.models.*;
import com.canigraduate.uchicago.models.Section;
import com.canigraduate.uchicago.serializers.SectionSerializer;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Streams;
import com.google.gson.JsonObject;

import java.util.AbstractMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class Sections {
    private final CollectionReference root;
    private final String term;
    private final String course;

    public Sections(String course, String term) {
        this.course = course;
        this.term = term;
        this.root = FirestoreService.getUChicago()
                .collection("courses")
                .document(course)
                .collection("terms")
                .document(term)
                .collection("sections");
    }

    public void delete(String section) {
        String transaction = FirestoreService.beginTransaction();
        List<Value> terms = this.root.getParent()
                .get(transaction)
                .flatMap(document -> document.getFields().get("sections"))
                .map(value -> value.getArray().toList().stream().map(Value::getString))
                .orElse(Stream.empty())
                .filter(element -> !element.equals(section))
                .map(Value::new)
                .collect(Collectors.toList());
        FirestoreService.commit(ImmutableList.of(
                new Write().setUpdateMask(new DocumentMask().setFieldPaths(ImmutableList.of("sections")))
                        .setUpdate(new Document().setName("courses/" + this.course + "/terms/" + this.term)
                                .setFields(new MapValue().put("sections", new ArrayValue(terms))))), transaction);
        this.root.document(section).delete();
    }

    public Write getDeleteWrite(String section) {
        return new Write().setDelete(FirestoreService.getBasePath() + "/" + this.root.document(section).getPath());
    }

    public Iterable<String> list() {
        return this.root.documentIds();
    }

    public Iterable<String> listFromParent() {
        return this.root.getParent()
                .get()
                .flatMap(doc -> doc.getFields().get("sections"))
                .map(value -> value.getArray().toList().stream().map(Value::getString).collect(Collectors.toList()))
                .orElse(ImmutableList.of());
    }

    public Iterable<Map.Entry<String, Section>> all() {
        return Streams.stream(this.root.allDocuments())
                .map(doc -> new AbstractMap.SimpleImmutableEntry<>(doc.getId(),
                        SectionDeserializer.fromMapValue(doc.getFields())))
                .collect(Collectors.toList());
    }

    public Optional<Section> get(String section) {
        return this.get(section, null);
    }

    private Optional<Section> get(String section, String transaction) {
        return this.root.document(section)
                .get(transaction)
                .map(Document::getFields)
                .map(SectionDeserializer::fromMapValue);
    }

    public JsonObject set(String id, Section section) {
        return FirestoreService.commit(ImmutableList.of(this.getSetWrite(id, section)));
    }

    /**
     * Don't forget to call finalizeSetWrite() after executing the write.
     */
    public Write getSetWrite(String id, Section section) {
        return new Write().setUpdate(new Document().setFields(SectionSerializer.toMapValue(section))
                .setName("courses/" + this.course + "/terms/" + this.term + "/sections/" + id));
    }

    public JsonObject setSectionIndex(Iterable<String> sections) {
        return FirestoreService.commit(ImmutableList.of(
                new Write().setUpdateMask(new DocumentMask().setFieldPaths(ImmutableList.of("sections")))
                        .setUpdate(new Document().setName("courses/" + this.course + "/terms/" + this.term)
                                .setFields(new MapValue().put("sections", new ArrayValue(
                                        Streams.stream(sections).map(Value::new).collect(Collectors.toList())))))));
    }

    public Iterable<String> list(String transaction) {
        return this.root.documentIds(transaction);
    }
}
