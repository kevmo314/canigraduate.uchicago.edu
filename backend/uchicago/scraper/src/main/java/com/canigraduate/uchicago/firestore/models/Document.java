package com.canigraduate.uchicago.firestore.models;

import com.canigraduate.uchicago.firestore.FirestoreService;
import com.google.gson.JsonObject;

public class Document {
    private final JsonObject object;

    public Document() {
        this.object = new JsonObject();
    }

    public Document(JsonObject object) {
        if (object.has("error")) {
            throw new IllegalStateException(object.getAsJsonObject("error").get("message").getAsString());
        }
        this.object = object;
    }

    public JsonObject toJsonObject() {
        return object;
    }

    private String getName() {
        return toJsonObject().get("name").getAsString();
    }

    public Document setName(String name) {
        this.object.addProperty("name", FirestoreService.getUChicagoPath() + "/" + name);
        return this;
    }

    public String getId() {
        String[] nameTokens = this.getName().split("/");
        return nameTokens[nameTokens.length - 1];
    }

    public String getCreateTime() {
        return toJsonObject().get("createTime").getAsString();
    }

    public String getUpdateTime() {
        return toJsonObject().get("updateTime").getAsString();
    }

    public MapValue getFields() {
        return new MapValue(toJsonObject());
    }

    public Document setFields(MapValue fields) {
        fields.toJsonObject().entrySet().forEach(entry -> this.object.add(entry.getKey(), entry.getValue()));
        return this;
    }
}
