package com.canigraduate.uchicago.deserializers;

import com.canigraduate.uchicago.firestore.models.MapValue;
import com.canigraduate.uchicago.firestore.models.Value;
import com.canigraduate.uchicago.models.Term;

import java.util.Map;

public class TermDeserializer {
    public static Term fromMap(Map<String, Object> term) {
        return Term.create(String.format("%s %d", term.get("name"), term.get("year")));
    }

    public static Term fromMapValue(MapValue fields) {
        return Term.create(String.format("%s %d", fields.get("period").map(Value::getString).get(),
                fields.get("year").map(Value::getInteger).get()));
    }
}
