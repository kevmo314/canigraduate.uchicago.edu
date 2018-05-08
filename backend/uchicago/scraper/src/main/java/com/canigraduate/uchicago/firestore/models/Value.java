package com.canigraduate.uchicago.firestore.models;

import com.google.common.base.Preconditions;
import com.google.gson.JsonObject;

import java.util.Arrays;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

public class Value {
    private final JsonObject object;

    public Value(JsonObject object) {
        Preconditions.checkNotNull(object);
        Preconditions.checkState(!object.isJsonNull());
        this.object = object;
    }

    public Value(boolean value) {
        this.object = new JsonObject();
        this.object.addProperty("booleanValue", value);
    }

    public Value(long value) {
        this.object = new JsonObject();
        this.object.addProperty("integerValue", String.valueOf(value));
    }

    public Value(double value) {
        this.object = new JsonObject();
        this.object.addProperty("doubleValue", value);
    }

    public Value(byte[] value) {
        this.object = new JsonObject();
        this.object.addProperty("bytesValue", Base64.getEncoder().encodeToString(value));
    }

    public Value(String value) {
        this.object = new JsonObject();
        this.object.addProperty("stringValue", value);
    }

    public Value(ArrayValue value) {
        this.object = new JsonObject();
        this.object.add("arrayValue", value.toJsonObject());
    }

    public Value(MapValue value) {
        this.object = new JsonObject();
        this.object.add("mapValue", value.toJsonObject());
    }

    public JsonObject toJsonObject() {
        return this.object;
    }

    private boolean getBoolean() {
        return this.object.get("booleanValue").getAsBoolean();
    }

    public long getInteger() {
        return Long.parseLong(this.object.get("integerValue").getAsString());
    }

    private double getDouble() {
        return this.object.get("doubleValue").getAsDouble();
    }

    public String getString() {
        return this.object.get("stringValue").getAsString();
    }

    public byte[] getBytes() {
        return Base64.getDecoder().decode(this.object.get("bytesValue").getAsString());
    }

    public ArrayValue getArray() {
        return new ArrayValue(this.object.get("arrayValue").getAsJsonObject());
    }

    public MapValue getMap() {
        return new MapValue(this.object.get("mapValue").getAsJsonObject());
    }

    private Optional<String> getTypeKey() {
        return this.object.entrySet().stream().findFirst().map(Map.Entry::getKey);
    }

    public boolean equals(Value that) {
        if (!this.getTypeKey().equals(that.getTypeKey())) {
            return false;
        }
        return this.getTypeKey().map(typeKey -> {
            switch (typeKey) {
                case "booleanValue":
                    return this.getBoolean() == that.getBoolean();
                case "integerValue":
                    return this.getInteger() == that.getInteger();
                case "doubleValue":
                    return this.getDouble() == that.getDouble();
                case "stringValue":
                    return this.getString().equals(that.getString());
                case "bytesValue":
                    return Arrays.equals(this.getBytes(), that.getBytes());
                case "arrayValue":
                    return this.getArray().equals(that.getArray());
                case "mapValue":
                    return this.getMap().equals(that.getMap());
            }
            throw new RuntimeException("Invalid type: " + typeKey);
        }).orElse(true);
    }
}
