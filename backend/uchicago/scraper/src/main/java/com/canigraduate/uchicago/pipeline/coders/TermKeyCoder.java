package com.canigraduate.uchicago.pipeline.coders;

import com.canigraduate.uchicago.models.Term;
import com.canigraduate.uchicago.pipeline.models.TermKey;
import org.apache.beam.sdk.coders.Coder;
import org.apache.beam.sdk.coders.CustomCoder;
import org.apache.beam.sdk.coders.StringUtf8Coder;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class TermKeyCoder extends CustomCoder<TermKey> {
    private static final Coder<Term> TERM_CODER = TermCoder.of();
    private static final Coder<String> STRING_UTF_8_CODER = StringUtf8Coder.of();

    public static TermKeyCoder of() {
        return new TermKeyCoder();
    }

    @Override
    public void encode(TermKey value, OutputStream outStream) throws IOException {
        TERM_CODER.encode(value.getTerm(), outStream);
        STRING_UTF_8_CODER.encode(value.getCourse(), outStream);
    }

    @Override
    public TermKey decode(InputStream inStream) throws IOException {
        return TermKey.builder()
                .setTerm(TERM_CODER.decode(inStream))
                .setCourse(STRING_UTF_8_CODER.decode(inStream))
                .build();
    }

    @Override
    public void verifyDeterministic() throws NonDeterministicException {
        verifyDeterministic(this, "Value coder must be deterministic", TERM_CODER);
        verifyDeterministic(this, "Value coder must be deterministic", STRING_UTF_8_CODER);
    }
}
