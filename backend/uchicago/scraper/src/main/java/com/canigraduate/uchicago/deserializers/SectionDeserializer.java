package com.canigraduate.uchicago.deserializers;

import com.canigraduate.uchicago.firestore.models.ArrayValue;
import com.canigraduate.uchicago.firestore.models.MapValue;
import com.canigraduate.uchicago.firestore.models.Value;
import com.canigraduate.uchicago.models.Section;

public class SectionDeserializer {
    public static Section fromMapValue(MapValue fields) {
        Section.Builder builder = Section.builder().setPrerequisites(fields.get("prerequisites").map(Value::getString));
        fields.get("notes")
                .map(Value::getArray)
                .map(ArrayValue::toList)
                .ifPresent(values -> values.forEach(value -> builder.addNote(value.getString())));
        fields.get("enrollment")
                .map(Value::getMap)
                .map(EnrollmentDeserializer::fromMapValue)
                .ifPresent(builder::setEnrollment);
        fields.get("primaries")
                .map(Value::getArray)
                .map(ArrayValue::toList)
                .ifPresent(values -> values.forEach(
                        value -> builder.addPrimaryActivity(PrimaryActivityDeserializer.fromMapValue(value.getMap()))));
        fields.get("secondaries")
                .map(Value::getArray)
                .map(ArrayValue::toList)
                .ifPresent(values -> values.forEach(value -> builder.addSecondaryActivity(
                        SecondaryActivityDeserializer.fromMapValue(value.getMap()))));
        return builder.build();
    }
}
