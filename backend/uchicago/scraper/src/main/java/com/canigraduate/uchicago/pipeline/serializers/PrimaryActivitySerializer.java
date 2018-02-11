package com.canigraduate.uchicago.pipeline.serializers;

import com.canigraduate.uchicago.models.PrimaryActivity;
import com.canigraduate.uchicago.models.Schedule;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.Lists;

import java.util.Map;
import java.util.function.Function;

public class PrimaryActivitySerializer implements Function<PrimaryActivity, Map<String, Object>> {
    @Override
    public Map<String, Object> apply(PrimaryActivity activity) {
        return new ImmutableMap.Builder().put("instructors", activity.getInstructors())
                .put("type", activity.getType())
                .put("schedule", Lists.transform(activity.getSchedule().getBlocks().asList(), Schedule.Block::toLong))
                .put("location", activity.getLocation())
                .build();
    }
}
