package com.canigraduate.uchicago.pipeline.coders;

import com.canigraduate.uchicago.models.Grade;
import org.apache.beam.sdk.coders.Coder;
import org.apache.beam.sdk.coders.CustomCoder;
import org.apache.beam.sdk.coders.StringUtf8Coder;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class GradeCoder extends CustomCoder<Grade> {
    private static final Coder<String> STRING_CODER = StringUtf8Coder.of();

    public static GradeCoder of() {
        return new GradeCoder();
    }

    @Override
    public void encode(Grade value, OutputStream outStream) throws IOException {
        STRING_CODER.encode(value.getGrade(), outStream);
    }

    @Override
    public Grade decode(InputStream inStream) throws IOException {
        return Grade.create(STRING_CODER.decode(inStream));
    }

    @Override
    public void verifyDeterministic() throws NonDeterministicException {
        verifyDeterministic(this, "Value coder must be deterministic", STRING_CODER);
    }
}