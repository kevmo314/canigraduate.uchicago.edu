package com.canigraduate.uchicago.firestore.models;

import com.google.gson.JsonObject;

public class Write {
    private final JsonObject object;

    public Write() {
        this.object = new JsonObject();
    }

    public Write(JsonObject parse) {
        this.object = parse;
    }

    public JsonObject toJsonObject() {
        return this.object;
    }

    public Write setUpdate(Document document) {
        this.clearUnionFields();
        this.object.add("update", document.toJsonObject());
        return this;
    }

    public Write setDelete(String path) {
        this.clearUnionFields();
        this.object.addProperty("delete", path);
        return this;
    }

    private void clearUnionFields() {
        this.object.remove("update");
        this.object.remove("delete");
        this.object.remove("transform");
    }

}
