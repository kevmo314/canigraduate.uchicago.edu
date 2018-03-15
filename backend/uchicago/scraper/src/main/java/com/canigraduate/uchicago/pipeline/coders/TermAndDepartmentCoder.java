package com.canigraduate.uchicago.pipeline.coders;

import com.canigraduate.uchicago.models.Term;
import com.canigraduate.uchicago.pipeline.models.TermAndDepartment;
import org.apache.beam.sdk.coders.Coder;
import org.apache.beam.sdk.coders.CustomCoder;
import org.apache.beam.sdk.coders.StringUtf8Coder;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class TermAndDepartmentCoder extends CustomCoder<TermAndDepartment> {
    private static final Coder<Term> TERM_CODER = TermCoder.of();
    private static final Coder<String> STRING_UTF_8_CODER = StringUtf8Coder.of();

    public static TermAndDepartmentCoder of() {
        return new TermAndDepartmentCoder();
    }

    @Override
    public void encode(TermAndDepartment value, OutputStream outStream) throws IOException {
        TERM_CODER.encode(value.getTerm(), outStream);
        STRING_UTF_8_CODER.encode(value.getDepartment(), outStream);
    }

    @Override
    public TermAndDepartment decode(InputStream inStream) throws IOException {
        return TermAndDepartment.create(TERM_CODER.decode(inStream), STRING_UTF_8_CODER.decode(inStream));
    }

    @Override
    public void verifyDeterministic() throws NonDeterministicException {
        verifyDeterministic(this, "Value coder must be deterministic", TERM_CODER);
        verifyDeterministic(this, "Value coder must be deterministic", STRING_UTF_8_CODER);
    }
}
