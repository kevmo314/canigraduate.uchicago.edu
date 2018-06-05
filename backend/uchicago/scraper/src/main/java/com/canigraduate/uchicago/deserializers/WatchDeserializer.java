package com.canigraduate.uchicago.deserializers;

import com.canigraduate.uchicago.firestore.models.MapValue;
import com.canigraduate.uchicago.firestore.models.Value;
import com.canigraduate.uchicago.models.Watch;

public class WatchDeserializer {
    public static Watch fromMapValue(MapValue fields) {
        return Watch.builder()
                .setCourse(fields.get("course").map(Value::getString).orElse("Unknown"))
                .setSection(fields.get("section").map(Value::getString).orElse("Unknown"))
                .setTerm(fields.get("term").map(Value::getString).orElse("Unknown"))
                .build();
    }
}
