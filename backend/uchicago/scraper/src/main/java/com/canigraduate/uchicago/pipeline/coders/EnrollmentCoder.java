package com.canigraduate.uchicago.pipeline.coders;

import com.canigraduate.uchicago.models.Enrollment;
import org.apache.beam.sdk.coders.Coder;
import org.apache.beam.sdk.coders.CustomCoder;
import org.apache.beam.sdk.coders.VarIntCoder;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.OptionalInt;

public class EnrollmentCoder extends CustomCoder<Enrollment> {
    private static final Coder<OptionalInt> OPTIONAL_INT_CODER = OptionalIntCoder.of(VarIntCoder.of());

    public static EnrollmentCoder of() {
        return new EnrollmentCoder();
    }

    @Override
    public void encode(Enrollment value, OutputStream outStream) throws IOException {
        OPTIONAL_INT_CODER.encode(value.getEnrolled(), outStream);
        OPTIONAL_INT_CODER.encode(value.getMaximum(), outStream);
    }

    @Override
    public Enrollment decode(InputStream inStream) throws IOException {
        return Enrollment.builder()
                .setEnrolled(OPTIONAL_INT_CODER.decode(inStream))
                .setMaximum(OPTIONAL_INT_CODER.decode(inStream))
                .build();
    }
}