package com.canigraduate.uchicago.serializers;

import com.canigraduate.uchicago.firestore.models.ArrayValue;
import com.canigraduate.uchicago.firestore.models.MapValue;
import com.canigraduate.uchicago.firestore.models.Value;
import com.canigraduate.uchicago.models.Course;
import com.google.common.collect.ImmutableMap;

import java.util.Map;
import java.util.stream.Collectors;

public class CourseSerializer {
    public static Map<String, Object> toMap(Course course) {
        return new ImmutableMap.Builder<String, Object>().put("name", course.getName())
                .put("description", course.getDescription().orElse(null))
                .put("sequence", course.getParent().orElse(null))
                .put("priority", course.getPriority())
                .put("crosslists", course.getCrosslists())
                .put("notes", course.getNotes())
                .build();
    }

    public static MapValue toMapValue(Course course) {
        MapValue fields = new MapValue().put("name", course.getName())
                .put("priority", course.getPriority())
                .put("crosslists",
                        new ArrayValue(course.getCrosslists().stream().map(Value::new).collect(Collectors.toList())))
                .put("notes", new ArrayValue(course.getNotes().stream().map(Value::new).collect(Collectors.toList())));
        course.getDescription().ifPresent(value -> fields.put("description", value));
        course.getParent().ifPresent(value -> fields.put("sequence", value));
        return fields;
    }
}
