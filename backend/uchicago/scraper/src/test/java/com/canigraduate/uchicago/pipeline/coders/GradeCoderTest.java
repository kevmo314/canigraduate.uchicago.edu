package com.canigraduate.uchicago.pipeline.coders;

import com.canigraduate.uchicago.models.Grade;
import org.apache.beam.sdk.coders.Coder;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.assertThat;

class GradeCoderTest {
    @Test
    void test() throws IOException {
        Coder<Grade> coder = GradeCoder.of();
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Grade grade = Grade.create("grade");
        coder.encode(grade, outputStream);
        InputStream inputStream = new ByteArrayInputStream(outputStream.toByteArray());
        assertThat(coder.decode(inputStream)).isEqualTo(grade);
    }
}