package com.canigraduate.uchicago.pipeline.serializers;

import com.canigraduate.uchicago.models.Course;
import com.google.common.collect.ImmutableMap;

import java.util.Map;
import java.util.function.Function;

public class CourseSerializer implements Function<Course, Map<String, Object>> {
    @Override
    public Map<String, Object> apply(Course course) {
        return new ImmutableMap.Builder().put("name", course.getName())
                .put("description", course.getDescription().orElse(null))
                .put("sequence", course.getParent().orElse(null))
                .put("priority", course.getPriority())
                .put("crosslists", course.getCrosslists())
                .put("notes", course.getNotes())
                .build();
    }
}
