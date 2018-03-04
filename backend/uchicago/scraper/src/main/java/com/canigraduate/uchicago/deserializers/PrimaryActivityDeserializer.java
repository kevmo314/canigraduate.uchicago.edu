package com.canigraduate.uchicago.deserializers;

import com.canigraduate.uchicago.firestore.models.ArrayValue;
import com.canigraduate.uchicago.firestore.models.MapValue;
import com.canigraduate.uchicago.firestore.models.Value;
import com.canigraduate.uchicago.models.PrimaryActivity;
import com.canigraduate.uchicago.models.Schedule;
import com.google.common.collect.ImmutableSet;

class PrimaryActivityDeserializer {
    public static PrimaryActivity fromMapValue(MapValue fields) {
        PrimaryActivity.Builder builder = PrimaryActivity.builder()
                .setType(fields.get("type").map(Value::getString))
                .setLocation(fields.get("location").map(Value::getString).get());
        fields.get("instructors")
                .map(Value::getArray)
                .map(ArrayValue::toList)
                .ifPresent(values -> values.forEach(value -> builder.addInstructor(value.getString())));
        fields.get("schedule")
                .map(Value::getArray)
                .map(ArrayValue::toList)
                .map(values -> Schedule.create(values.stream()
                        .map(Value::getInteger)
                        .map(Schedule.Block::fromLong)
                        .collect(ImmutableSet.toImmutableSet())))
                .ifPresent(builder::setSchedule);
        return builder.build();
    }
}
