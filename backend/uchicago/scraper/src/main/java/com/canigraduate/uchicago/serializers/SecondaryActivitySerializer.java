package com.canigraduate.uchicago.serializers;

import com.canigraduate.uchicago.firestore.models.ArrayValue;
import com.canigraduate.uchicago.firestore.models.MapValue;
import com.canigraduate.uchicago.firestore.models.Value;
import com.canigraduate.uchicago.models.Schedule;
import com.canigraduate.uchicago.models.SecondaryActivity;
import com.google.common.collect.ImmutableMap;

import java.util.Map;
import java.util.stream.Collectors;

class SecondaryActivitySerializer {
    public static Map<String, Object> toMap(SecondaryActivity activity) {
        return new ImmutableMap.Builder<String, Object>().put("id", activity.getId())
                .put("instructors", activity.getInstructors())
                .put("type", activity.getType())
                .put("schedule", activity.getSchedule()
                        .getBlocks()
                        .stream()
                        .map(Schedule.Block::toLong)
                        .collect(Collectors.toList()))
                .put("location", activity.getLocation())
                .put("enrollment", EnrollmentSerializer.toMap(activity.getEnrollment()))
                .build();
    }

    public static MapValue toMapValue(SecondaryActivity activity) {
        MapValue fields = new MapValue().put("id", activity.getId())
                .put("instructors",
                        new ArrayValue(activity.getInstructors().stream().map(Value::new).collect(Collectors.toList())))
                .put("location", activity.getLocation())
                .put("schedule", new ArrayValue(activity.getSchedule()
                        .getBlocks()
                        .stream()
                        .map(block -> new Value(block.toLong()))
                        .collect(Collectors.toList())))
                .put("enrollment", EnrollmentSerializer.toMapValue(activity.getEnrollment()));
        activity.getType().ifPresent(type -> fields.put("type", type));
        return fields;
    }
}
