package com.canigraduate.uchicago.pipeline.coders;

import com.canigraduate.uchicago.models.PrimaryActivity;
import com.canigraduate.uchicago.models.Schedule;
import org.apache.beam.sdk.coders.Coder;
import org.apache.beam.sdk.coders.CustomCoder;
import org.apache.beam.sdk.coders.SetCoder;
import org.apache.beam.sdk.coders.StringUtf8Coder;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Optional;
import java.util.Set;

public class PrimaryActivityCoder extends CustomCoder<PrimaryActivity> {
    private static final Coder<String> STRING_CODER = StringUtf8Coder.of();
    private static final Coder<Schedule> SCHEDULE_CODER = ScheduleCoder.of();
    private static final Coder<Set<String>> STRING_SET_CODER = SetCoder.of(STRING_CODER);
    private static final Coder<Optional<String>> STRING_OPTIONAL_CODER = OptionalCoder.of(STRING_CODER);

    public static PrimaryActivityCoder of() {
        return new PrimaryActivityCoder();
    }

    @Override
    public void encode(PrimaryActivity value, OutputStream outStream) throws IOException {
        STRING_SET_CODER.encode(value.getInstructors(), outStream);
        SCHEDULE_CODER.encode(value.getSchedule(), outStream);
        STRING_OPTIONAL_CODER.encode(value.getType(), outStream);
        STRING_CODER.encode(value.getLocation(), outStream);
    }

    @Override
    public PrimaryActivity decode(InputStream inStream) throws IOException {
        return PrimaryActivity.builder()
                .addAllInstructors(STRING_SET_CODER.decode(inStream))
                .setSchedule(SCHEDULE_CODER.decode(inStream))
                .setType(STRING_OPTIONAL_CODER.decode(inStream))
                .setLocation(STRING_CODER.decode(inStream))
                .build();
    }
}