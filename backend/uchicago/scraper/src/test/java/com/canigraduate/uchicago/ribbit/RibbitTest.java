package com.canigraduate.uchicago.ribbit;

import com.canigraduate.uchicago.models.Course;
import org.junit.Test;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

public class RibbitTest {

    @Test
    public void getRecordForCourse() throws IOException {
        Course record = Ribbit.getRecordForCourse("MATH 19900");
        assertThat(record.getName()).isEqualTo("Introduction to Analysis and Linear Algebra");
        assertThat(record.getDescription()).isNotEmpty();
    }

    @Test
    public void getNonexistent() throws IOException {
        assertThat(Ribbit.getRecordForCourse("MATH SLDJF")).isNull();
    }
}