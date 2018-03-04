package com.canigraduate.uchicago.serializers;

import com.canigraduate.uchicago.firestore.models.ArrayValue;
import com.canigraduate.uchicago.firestore.models.MapValue;
import com.canigraduate.uchicago.firestore.models.Value;
import com.canigraduate.uchicago.models.Section;
import com.google.common.collect.ImmutableMap;

import java.util.Map;
import java.util.stream.Collectors;

public class SectionSerializer {
    public static Map<String, Object> toMap(Section section) {
        return new ImmutableMap.Builder<String, Object>().put("prerequisites", section.getPrerequisites().orElse(null))
                .put("notes", section.getNotes())
                .put("enrollment", EnrollmentSerializer.toMap(section.getEnrollment()))
                .put("primaries", section.getPrimaryActivities()
                        .asList()
                        .stream()
                        .map(PrimaryActivitySerializer::toMap)
                        .collect(Collectors.toList()))
                .put("secondaries", section.getSecondaryActivities()
                        .asList()
                        .stream()
                        .map(SecondaryActivitySerializer::toMap)
                        .collect(Collectors.toList()))
                .build();
    }

    public static MapValue toMapValue(Section section) {
        MapValue fields = new MapValue().put("notes",
                new ArrayValue(section.getNotes().asList().stream().map(Value::new).collect(Collectors.toList())))
                .put("enrollment", EnrollmentSerializer.toMapValue(section.getEnrollment()))
                .put("primaries", new ArrayValue(section.getPrimaryActivities()
                        .asList()
                        .stream()
                        .map(activity -> new Value(PrimaryActivitySerializer.toMapValue(activity)))
                        .collect(Collectors.toList())))
                .put("secondaries", new ArrayValue(section.getSecondaryActivities()
                        .asList()
                        .stream()
                        .map(activity -> new Value(SecondaryActivitySerializer.toMapValue(activity)))
                        .collect(Collectors.toList())));
        section.getPrerequisites().ifPresent(value -> fields.put("prerequisites", value));
        return fields;
    }
}
