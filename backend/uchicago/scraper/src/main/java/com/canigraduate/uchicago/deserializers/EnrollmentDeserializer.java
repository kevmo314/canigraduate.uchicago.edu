package com.canigraduate.uchicago.deserializers;

import com.canigraduate.uchicago.firestore.models.MapValue;
import com.canigraduate.uchicago.firestore.models.Value;
import com.canigraduate.uchicago.models.Enrollment;
import com.google.common.primitives.Ints;

class EnrollmentDeserializer {
    public static Enrollment fromMapValue(MapValue fields) {
        Enrollment.Builder builder = Enrollment.builder();
        fields.get("enrolled").map(Value::getInteger).map(Ints::checkedCast).ifPresent(builder::setEnrolled);
        fields.get("maximum").map(Value::getInteger).map(Ints::checkedCast).ifPresent(builder::setMaximum);
        return builder.build();
    }
}
