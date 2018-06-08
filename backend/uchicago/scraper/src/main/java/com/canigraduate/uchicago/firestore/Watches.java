package com.canigraduate.uchicago.firestore;

import com.canigraduate.uchicago.deserializers.WatchDeserializer;
import com.canigraduate.uchicago.firestore.models.Document;
import com.canigraduate.uchicago.models.Watch;
import com.google.common.collect.Streams;

import java.util.AbstractMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public class Watches {

    //private static final Logger LOGGER = Logger.getLogger(Courses.class.getName());

    private final CollectionReference root;

    public Watches() {
        this.root = FirestoreService.getUChicago().collection("watches");
    }

    public Iterable<String> list() {
        return this.root.documentIds();
    }

    public Optional<Watch> get(String watch) {
        return this.root.document(watch)
                .get()
                .map(Document::getFields)
                .filter(fields -> fields.get("course").isPresent())
                .map(WatchDeserializer::fromMapValue);
    }

    public Iterable<Map.Entry<String, Watch>> all() {
        return Streams.stream(this.root.allDocuments())
                .map(doc -> new AbstractMap.SimpleImmutableEntry<>(doc.getId(),
                        WatchDeserializer.fromMapValue(doc.getFields())))
                .collect(Collectors.toList());
    }
}
