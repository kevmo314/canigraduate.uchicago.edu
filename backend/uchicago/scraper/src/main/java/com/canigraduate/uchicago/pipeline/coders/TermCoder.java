package com.canigraduate.uchicago.pipeline.coders;

import com.canigraduate.uchicago.models.Term;
import org.apache.beam.sdk.coders.Coder;
import org.apache.beam.sdk.coders.CustomCoder;
import org.apache.beam.sdk.coders.StringUtf8Coder;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class TermCoder extends CustomCoder<Term> {
    private static final Coder<String> STRING_CODER = StringUtf8Coder.of();

    public static TermCoder of() {
        return new TermCoder();
    }

    @Override
    public void encode(Term value, OutputStream outStream) throws IOException {
        STRING_CODER.encode(value.getTerm(), outStream);
    }

    @Override
    public Term decode(InputStream inStream) throws IOException {
        return Term.create(STRING_CODER.decode(inStream));
    }
}