package com.canigraduate.uchicago.pipeline.coders;

import com.canigraduate.uchicago.models.Term;
import org.apache.beam.sdk.coders.Coder;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.assertThat;

public class TermCoderTest {
    @Test
    public void test() throws IOException {
        Coder<Term> coder = TermCoder.of();
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Term grade = Term.create("grade");
        coder.encode(grade, outputStream);
        InputStream inputStream = new ByteArrayInputStream(outputStream.toByteArray());
        assertThat(coder.decode(inputStream)).isEqualTo(grade);
    }
}