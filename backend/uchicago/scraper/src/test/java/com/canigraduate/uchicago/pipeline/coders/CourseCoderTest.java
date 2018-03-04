package com.canigraduate.uchicago.pipeline.coders;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.timeschedules.Timeschedules;
import org.apache.beam.sdk.coders.Coder;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class CourseCoderTest {
    @Test
    void test() throws IOException {
        Map<String, Course> courses = Timeschedules.getCourses(
                "http://timeschedules.uchicago.edu/view.php?dept=PHYS&term=81");
        assertThat(courses).containsKey("PHYS 13300");
        Coder<Course> coder = CourseCoder.of();
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        coder.encode(courses.get("PHYS 13300"), outputStream);
        InputStream inputStream = new ByteArrayInputStream(outputStream.toByteArray());
        assertThat(coder.decode(inputStream)).isEqualTo(courses.get("PHYS 13300"));
    }
}
