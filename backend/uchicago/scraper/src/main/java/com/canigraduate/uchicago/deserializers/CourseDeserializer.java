package com.canigraduate.uchicago.deserializers;

import com.canigraduate.uchicago.firestore.models.MapValue;
import com.canigraduate.uchicago.firestore.models.Value;
import com.canigraduate.uchicago.models.Course;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Lists;
import com.google.common.primitives.Ints;

public class CourseDeserializer {

    public static Course fromMapValue(MapValue fields) {
        return Course.builder()
                .setName(fields.get("name").map(Value::getString).orElse("Unknown"))
                .setDescription(fields.get("description").map(Value::getString))
                .setPriority(fields.get("priority").map(Value::getInteger).map(Ints::checkedCast).orElse(-1))
                .setParent(fields.get("sequence").map(Value::getString))
                .addAllCrosslists(fields.get("crosslists")
                        .map(Value::getArray)
                        .map(arrayValue -> Lists.transform(arrayValue.toList(), Value::getString))
                        .orElse(ImmutableList.of()))
                .addAllNotes(fields.get("notes")
                        .map(Value::getArray)
                        .map(arrayValue -> Lists.transform(arrayValue.toList(), Value::getString))
                        .orElse(ImmutableList.of()))
                .build();
    }
}
