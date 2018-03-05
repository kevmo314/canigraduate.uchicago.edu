package com.canigraduate.uchicago.pipeline.coders;

import com.canigraduate.uchicago.models.Enrollment;
import com.canigraduate.uchicago.models.Schedule;
import com.canigraduate.uchicago.models.SecondaryActivity;
import org.apache.beam.sdk.coders.Coder;
import org.apache.beam.sdk.coders.CustomCoder;
import org.apache.beam.sdk.coders.SetCoder;
import org.apache.beam.sdk.coders.StringUtf8Coder;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Optional;
import java.util.Set;

public class SecondaryActivityCoder extends CustomCoder<SecondaryActivity> {
    private static final Coder<String> STRING_CODER = StringUtf8Coder.of();
    private static final Coder<Schedule> SCHEDULE_CODER = ScheduleCoder.of();
    private static final Coder<Set<String>> STRING_SET_CODER = SetCoder.of(STRING_CODER);
    private static final Coder<Optional<String>> STRING_OPTIONAL_CODER = OptionalCoder.of(STRING_CODER);
    private static final Coder<Enrollment> ENROLLMENT_CODER = EnrollmentCoder.of();

    public static SecondaryActivityCoder of() {
        return new SecondaryActivityCoder();
    }

    @Override
    public void encode(SecondaryActivity value, OutputStream outStream) throws IOException {
        STRING_CODER.encode(value.getId(), outStream);
        STRING_SET_CODER.encode(value.getInstructors(), outStream);
        SCHEDULE_CODER.encode(value.getSchedule(), outStream);
        STRING_OPTIONAL_CODER.encode(value.getType(), outStream);
        STRING_CODER.encode(value.getLocation(), outStream);
        ENROLLMENT_CODER.encode(value.getEnrollment(), outStream);
    }

    @Override
    public SecondaryActivity decode(InputStream inStream) throws IOException {
        return SecondaryActivity.builder()
                .setId(STRING_CODER.decode(inStream))
                .addAllInstructors(STRING_SET_CODER.decode(inStream))
                .setSchedule(SCHEDULE_CODER.decode(inStream))
                .setType(STRING_OPTIONAL_CODER.decode(inStream))
                .setLocation(STRING_CODER.decode(inStream))
                .setEnrollment(ENROLLMENT_CODER.decode(inStream))
                .build();
    }

    @Override
    public void verifyDeterministic() throws NonDeterministicException {
        verifyDeterministic(this, "Value coder must be deterministic", STRING_CODER);
        verifyDeterministic(this, "Value coder must be deterministic", SCHEDULE_CODER);
        verifyDeterministic(this, "Value coder must be deterministic", STRING_SET_CODER);
        verifyDeterministic(this, "Value coder must be deterministic", STRING_OPTIONAL_CODER);
        verifyDeterministic(this, "Value coder must be deterministic", ENROLLMENT_CODER);
    }
}