package com.canigraduate.uchicago.firestore;

import com.canigraduate.uchicago.deserializers.CourseDeserializer;
import com.canigraduate.uchicago.firestore.models.Document;
import com.canigraduate.uchicago.firestore.models.Write;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.serializers.CourseSerializer;
import com.google.common.collect.ImmutableList;
import com.google.gson.JsonObject;

import java.util.List;
import java.util.Optional;

public class Sequences {
    private final CollectionReference root;

    public Sequences() {
        this.root = FirestoreService.getUChicago().collection("sequences");
    }

    public void delete(String course) {
        root.document(course).delete();
    }

    public List<String> list() {
        return root.documentIds();
    }

    public Optional<Course> get(String course) {
        return get(course, null);
    }

    private Optional<Course> get(String course, String transaction) {
        return root.document(course).get(transaction).map(Document::getFields).map(CourseDeserializer::toMapValue);
    }

    public JsonObject set(String id, Course course) {
        return FirestoreService.commit(ImmutableList.of(new Write().setUpdate(
                new Document().setFields(CourseSerializer.toMapValue(course)).setName("sequences/" + id))));
    }
}
