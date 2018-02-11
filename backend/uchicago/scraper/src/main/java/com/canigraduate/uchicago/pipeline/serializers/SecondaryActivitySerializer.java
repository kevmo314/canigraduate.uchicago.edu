package com.canigraduate.uchicago.pipeline.serializers;

import com.canigraduate.uchicago.models.Schedule;
import com.canigraduate.uchicago.models.SecondaryActivity;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.Lists;

import java.util.Map;
import java.util.function.Function;

public class SecondaryActivitySerializer implements Function<SecondaryActivity, Map<String, Object>> {
    @Override
    public Map<String, Object> apply(SecondaryActivity activity) {
        return new ImmutableMap.Builder().put("id", activity.getId())
                .put("instructors", activity.getInstructors())
                .put("type", activity.getType())
                .put("schedule", Lists.transform(activity.getSchedule().getBlocks().asList(), Schedule.Block::toLong))
                .put("location", activity.getLocation())
                .put("enrollment", new EnrollmentSerializer().apply(activity.getEnrollment()))
                .build();
    }
}
