package com.canigraduate.uchicago.firestore;

import com.canigraduate.uchicago.deserializers.SectionDeserializer;
import com.canigraduate.uchicago.firestore.models.Document;
import com.canigraduate.uchicago.firestore.models.Write;
import com.canigraduate.uchicago.models.Section;
import com.canigraduate.uchicago.serializers.SectionSerializer;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Iterables;
import com.google.gson.JsonObject;

import java.util.Optional;

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
        root.document(section).delete();
    }

    public Write getDeleteWrite(String section) {
        return new Write().setDelete(FirestoreService.getBasePath() + "/" + root.document(section).getPath());
    }

    public Iterable<String> list() {
        return root.documentIds();
    }

    public Iterable<Section> all() {
        return Iterables.transform(root.allDocuments(), doc -> SectionDeserializer.fromMapValue(doc.getFields()));
    }

    public Optional<Section> get(String section) {
        return get(section, null);
    }

    private Optional<Section> get(String section, String transaction) {
        return root.document(section).get(transaction).map(Document::getFields).map(SectionDeserializer::fromMapValue);
    }

    public JsonObject set(String id, Section section) {
        return FirestoreService.commit(ImmutableList.of(getSetWrite(id, section)));
    }

    public Write getSetWrite(String id, Section section) {
        return new Write().setUpdate(new Document().setFields(SectionSerializer.toMapValue(section))
                .setName("courses/" + course + "/terms/" + term + "/sections/" + id));
    }

    public Iterable<String> list(String transaction) {
        return root.documentIds(transaction);
    }
}
