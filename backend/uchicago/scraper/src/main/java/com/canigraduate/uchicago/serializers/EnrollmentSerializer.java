package com.canigraduate.uchicago.serializers;

import com.canigraduate.uchicago.firestore.models.MapValue;
import com.canigraduate.uchicago.models.Enrollment;
import com.google.common.collect.ImmutableMap;

import java.util.Map;
import java.util.OptionalInt;

class EnrollmentSerializer {
    public static Map<String, Object> toMap(Enrollment enrollment) {
        OptionalInt enrolled = enrollment.getEnrolled();
        OptionalInt maximum = enrollment.getMaximum();
        return new ImmutableMap.Builder().put("enrolled", enrolled.isPresent() ? enrolled.getAsInt() : null)
                .put("maximum", maximum.isPresent() ? maximum.getAsInt() : null)
                .build();
    }

    public static MapValue toMapValue(Enrollment enrollment) {
        MapValue fields = new MapValue();
        enrollment.getEnrolled().ifPresent(enrolled -> fields.put("enrolled", enrolled));
        enrollment.getMaximum().ifPresent(maximum -> fields.put("maximum", maximum));
        return fields;
    }
}
