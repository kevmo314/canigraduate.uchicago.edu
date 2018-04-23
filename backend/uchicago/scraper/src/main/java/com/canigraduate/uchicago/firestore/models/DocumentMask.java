package com.canigraduate.uchicago.firestore.models;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

public class DocumentMask {
    private final JsonObject object;

    public DocumentMask() {
        this.object = new JsonObject();
    }

    public DocumentMask(JsonObject object) {
        if (object.has("error")) {
            throw new IllegalStateException(object.getAsJsonObject("error").get("message").getAsString());
        }
        this.object = object;
    }

    public DocumentMask setFieldPaths(Iterable<String> fieldPaths) {
        JsonArray array = new JsonArray();
        fieldPaths.forEach(array::add);
        this.object.add("fieldPaths", array);
        return this;
    }

    public JsonObject toJsonObject() {
        return this.object;
    }
}
