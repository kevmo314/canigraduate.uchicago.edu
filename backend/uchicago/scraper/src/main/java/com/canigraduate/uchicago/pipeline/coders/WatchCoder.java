package com.canigraduate.uchicago.pipeline.coders;

import com.canigraduate.uchicago.models.Watch;
import org.apache.beam.sdk.coders.Coder;
import org.apache.beam.sdk.coders.CustomCoder;
import org.apache.beam.sdk.coders.StringUtf8Coder;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class WatchCoder extends CustomCoder<Watch> {
    // for the git so stupid
    private static final Coder<String> STRING_CODER = StringUtf8Coder.of();


    public static TermCoder of() {
        return new TermCoder();
    }

    @Override
    public void encode(Watch value, OutputStream outStream) throws IOException {
        STRING_CODER.encode(value.getCourse(), outStream);
        STRING_CODER.encode(value.getSection(), outStream);
        STRING_CODER.encode(value.getTerm(), outStream);
    }

    @Override
    public Watch decode(InputStream inStream) throws IOException {
        return Watch.builder()
                .setCourse(STRING_CODER.decode(inStream))
                .setSection(STRING_CODER.decode(inStream))
                .setTerm(STRING_CODER.decode(inStream))
                .build();
    }

    @Override
    public void verifyDeterministic() throws NonDeterministicException {
        verifyDeterministic(this, "Value coder must be deterministic", STRING_CODER);
    }
}
