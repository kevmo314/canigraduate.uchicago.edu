package com.canigraduate.uchicago.pipeline.serializers;

import com.canigraduate.uchicago.models.Enrollment;
import com.google.common.collect.ImmutableMap;

import java.util.Map;
import java.util.OptionalInt;
import java.util.function.Function;

public class EnrollmentSerializer implements Function<Enrollment, Map<String, Object>> {
    @Override
    public Map<String, Object> apply(Enrollment enrollment) {
        OptionalInt enrolled = enrollment.getEnrolled();
        OptionalInt maximum = enrollment.getMaximum();
        return new ImmutableMap.Builder().put("enrolled", enrolled.isPresent() ? enrolled.getAsInt() : null)
                .put("maximum", maximum.isPresent() ? maximum.getAsInt() : null)
                .build();
    }
}
