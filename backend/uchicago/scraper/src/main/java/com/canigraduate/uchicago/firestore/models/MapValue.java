package com.canigraduate.uchicago.firestore.models;

import com.google.common.collect.ImmutableMap;
import com.google.gson.JsonObject;

import java.util.AbstractMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public class MapValue {

    private final JsonObject object;

    private MapValue(Map<String, ? extends Value> entries) {
        this.object = new JsonObject();
        JsonObject fields = new JsonObject();
        object.add("fields", fields);
        entries.forEach((key, value) -> fields.add(key, value.toJsonObject()));
    }

    public MapValue(JsonObject object) {
        this.object = object;
    }

    public MapValue() {
        this(ImmutableMap.of());
    }

    public JsonObject toJsonObject() {
        return object;
    }

    private JsonObject getFields() {
        return this.object.getAsJsonObject("fields");
    }

    public Map<String, Value> toMap() {
        return new ImmutableMap.Builder().putAll(this.getFields()
                .entrySet()
                .stream()
                .map(entry -> new AbstractMap.SimpleEntry(entry.getKey(),
                        new Value(entry.getValue().getAsJsonObject())))
                .collect(Collectors.toList())).build();
    }

    public Optional<Value> get(String key) {
        return Optional.ofNullable(this.getFields().getAsJsonObject(key)).map(Value::new);
    }

    public MapValue put(String key, Value value) {
        this.getFields().add(key, value.toJsonObject());
        return this;
    }

    public MapValue put(String key, String value) {
        this.getFields().add(key, new Value(value).toJsonObject());
        return this;
    }

    public MapValue put(String key, long value) {
        this.getFields().add(key, new Value(value).toJsonObject());
        return this;
    }

    public MapValue put(String key, boolean value) {
        this.getFields().add(key, new Value(value).toJsonObject());
        return this;
    }

    public MapValue put(String key, double value) {
        this.getFields().add(key, new Value(value).toJsonObject());
        return this;
    }

    public MapValue put(String key, ArrayValue value) {
        this.getFields().add(key, new Value(value).toJsonObject());
        return this;
    }

    public MapValue put(String key, MapValue value) {
        this.getFields().add(key, new Value(value).toJsonObject());
        return this;
    }
}
