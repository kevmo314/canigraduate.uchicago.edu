package com.canigraduate.uchicago.deserializers;

import com.canigraduate.uchicago.firestore.models.MapValue;
import com.canigraduate.uchicago.firestore.models.Value;
import com.canigraduate.uchicago.models.Course;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Lists;
import com.google.common.primitives.Ints;

import java.util.List;
import java.util.Map;

public class CourseDeserializer {
    public static Course fromMap(Map<String, Object> course) {
        return Course.builder()
                .setName((String) course.get("name"))
                .setDescription((String) course.get("description"))
                .setPriority((int) course.get("priority"))
                .setParent((String) course.get("sequence"))
                .addAllCrosslists((List<String>) course.get("crosslists"))
                .addAllNotes((List<String>) course.get("notes"))
                .build();
    }

    public static Course fromMapValue(MapValue fields) {
        return Course.builder()
                .setName(fields.get("name").map(Value::getString).get())
                .setDescription(fields.get("description").map(Value::getString))
                .setPriority(fields.get("priority").map(Value::getInteger).map(Ints::checkedCast).get())
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
