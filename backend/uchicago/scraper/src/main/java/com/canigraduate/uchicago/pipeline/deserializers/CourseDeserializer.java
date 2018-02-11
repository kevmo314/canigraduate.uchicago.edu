package com.canigraduate.uchicago.pipeline.deserializers;

import com.canigraduate.uchicago.models.Course;

import java.util.List;
import java.util.Map;
import java.util.function.Function;

public class CourseDeserializer implements Function<Map<String, Object>, Course> {

    @Override
    public Course apply(Map<String, Object> course) {
        return Course.builder()
                .setName((String) course.get("name"))
                .setDescription((String) course.get("description"))
                .setPriority((int) course.get("priority"))
                .setParent((String) course.get("sequence"))
                .addAllCrosslists((List<String>) course.get("crosslists"))
                .addAllNotes((List<String>) course.get("notes"))
                .build();
    }
}
