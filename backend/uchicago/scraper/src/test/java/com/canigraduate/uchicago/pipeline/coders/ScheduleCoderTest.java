package com.canigraduate.uchicago.pipeline.coders;

import com.canigraduate.uchicago.models.Schedule;
import org.apache.beam.sdk.coders.Coder;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.assertThat;

class ScheduleCoderTest {

    @Test
    void test() throws IOException {
        Coder<Schedule> coder = ScheduleCoder.of();
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Schedule schedule = Schedule.parse("MWF10:30AM-11:30AM");
        coder.encode(schedule, outputStream);
        InputStream inputStream = new ByteArrayInputStream(outputStream.toByteArray());
        assertThat(coder.decode(inputStream)).isEqualTo(schedule);
    }
}