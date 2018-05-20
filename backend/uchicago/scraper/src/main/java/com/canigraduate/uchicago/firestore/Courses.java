package com.canigraduate.uchicago.firestore;

import com.canigraduate.uchicago.deserializers.CourseDeserializer;
import com.canigraduate.uchicago.firestore.models.Document;
import com.canigraduate.uchicago.firestore.models.DocumentMask;
import com.canigraduate.uchicago.firestore.models.MapValue;
import com.canigraduate.uchicago.firestore.models.Write;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.serializers.CourseSerializer;
import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Streams;
import com.google.gson.JsonObject;

import java.util.AbstractMap;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Logger;
import java.util.stream.Collectors;

public class Courses {
    private static final Logger LOGGER = Logger.getLogger(Courses.class.getName());

    private final CollectionReference root;

    public Courses() {
        this.root = FirestoreService.getUChicago().collection("courses");
    }

    public void delete(String course) {
        this.root.document(course).delete();
    }

    public Iterable<String> list() {
        return this.root.documentIds();
    }

    public Iterable<Map.Entry<String, Course>> all() {
        return Streams.stream(this.root.allDocuments())
                .map(doc -> new AbstractMap.SimpleImmutableEntry<>(doc.getId(),
                        CourseDeserializer.fromMapValue(doc.getFields())))
                .collect(Collectors.toList());
    }

    public Optional<Course> get(String course) {
        return this.get(course, null);
    }

    public Optional<Course> get(String course, String transaction) {
        return this.root.document(course)
                .get(transaction)
                .map(Document::getFields)
                .filter(fields -> fields.get("name").isPresent())
                .map(CourseDeserializer::fromMapValue);
    }

    public JsonObject set(String id, Course course) {
        return this.set(id, course, null);
    }

    public JsonObject set(String id, Course course, String transaction) {
        Preconditions.checkState(id.length() == 10, "Course id is wrong length: " + id);
        MapValue fields = CourseSerializer.toMapValue(course);
        return FirestoreService.commit(ImmutableList.of(
                new Write().setUpdateMask(new DocumentMask().setFieldPaths(fields.toMap().keySet()))
                        .setUpdate(new Document().setFields(fields).setName("courses/" + id))), transaction);
    }
}
