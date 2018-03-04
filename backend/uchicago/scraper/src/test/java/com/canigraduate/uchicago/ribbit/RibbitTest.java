package com.canigraduate.uchicago.ribbit;

import com.canigraduate.uchicago.models.Course;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class RibbitTest {

    @Test
    void getRecordForCourse() throws IOException {
        Optional<Course> record = Ribbit.getRecordForCourse("MATH 19900");
        assertThat(record).isPresent();
        assertThat(record).map(Course::getName).contains("Introduction to Analysis and Linear Algebra");
        assertThat(record).flatMap(Course::getDescription).isPresent().isNotEmpty();
    }

    @Test
    void getNonexistent() throws IOException {
        assertThat(Ribbit.getRecordForCourse("MATH SLDJF")).isNotPresent();
    }
}