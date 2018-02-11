package com.canigraduate.uchicago.pipeline.serializers;

import com.canigraduate.uchicago.models.Section;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.Lists;

import java.util.Map;
import java.util.function.Function;

public class SectionSerializer implements Function<Section, Map<String, Object>> {
    @Override
    public Map<String, Object> apply(Section section) {
        return new ImmutableMap.Builder<String, Object>().put("prerequisites", section.getPrerequisites().orElse(null))
                .put("notes", section.getNotes())
                .put("enrollment", new EnrollmentSerializer().apply(section.getEnrollment()))
                .put("primaries", Lists.transform(section.getPrimaryActivities().asList(),
                        new PrimaryActivitySerializer()::apply))
                .put("secondaries", Lists.transform(section.getSecondaryActivities().asList(),
                        new SecondaryActivitySerializer()::apply))
                .build();
    }
}
