package com.canigraduate.uchicago.pipeline.coders;

import com.canigraduate.uchicago.models.Enrollment;
import org.apache.beam.sdk.coders.Coder;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.assertThat;

public class EnrollmentCoderTest {
    @Test
    public void test() throws IOException {
        Coder<Enrollment> coder = EnrollmentCoder.of();
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Enrollment enrollment = Enrollment.builder().setMaximum(4).setEnrolled(1).build();
        coder.encode(enrollment, outputStream);
        InputStream inputStream = new ByteArrayInputStream(outputStream.toByteArray());
        assertThat(coder.decode(inputStream)).isEqualTo(enrollment);
    }

    @Test
    public void test_withMissingMaximum() throws IOException {
        Coder<Enrollment> coder = EnrollmentCoder.of();
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Enrollment enrollment = Enrollment.builder().setEnrolled(1).build();
        coder.encode(enrollment, outputStream);
        InputStream inputStream = new ByteArrayInputStream(outputStream.toByteArray());
        assertThat(coder.decode(inputStream)).isEqualTo(enrollment);
    }


    @Test
    public void test_withMissingEnrolled() throws IOException {
        Coder<Enrollment> coder = EnrollmentCoder.of();
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Enrollment enrollment = Enrollment.builder().setMaximum(10).build();
        coder.encode(enrollment, outputStream);
        InputStream inputStream = new ByteArrayInputStream(outputStream.toByteArray());
        assertThat(coder.decode(inputStream)).isEqualTo(enrollment);
    }
}