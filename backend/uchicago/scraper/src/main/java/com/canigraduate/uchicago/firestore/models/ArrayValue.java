package com.canigraduate.uchicago.firestore.models;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.Iterators;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import java.util.List;

public class ArrayValue {
    private final JsonObject object;

    public ArrayValue(Iterable<Value> elements) {
        JsonArray array = new JsonArray();
        this.object = new JsonObject();
        object.add("values", array);
        elements.forEach(value -> array.add(value.toJsonObject()));
    }

    public ArrayValue(JsonObject object) {
        this.object = object;
    }

    public JsonObject toJsonObject() {
        return object;
    }

    public List<Value> toList() {
        if (!this.object.has("values")) {
            return ImmutableList.of();
        }
        return new ImmutableList.Builder().addAll(Iterators.transform(this.object.getAsJsonArray("values").iterator(),
                value -> new Value(value.getAsJsonObject()))).build();
    }
}
