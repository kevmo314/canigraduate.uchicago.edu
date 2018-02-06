package com.canigraduate.uchicago.collegecatalog;

import com.canigraduate.uchicago.models.Course;
import org.junit.Test;

import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

public class CollegeCatalogTest {
    @Test
    public void getDepartments() throws IOException {
        Map<String, String> departments = CollegeCatalog.getDepartments();
        assertThat(departments).isNotEmpty();
        assertThat(departments).containsEntry("Anthropology",
                "http://collegecatalog.uchicago.edu/thecollege/anthropology/");
    }

    @Test
    public void getCourses() throws IOException {
        Map<String, Course> courses = CollegeCatalog.getCourses(
                "http://collegecatalog.uchicago.edu/thecollege/anthropology/");
        assertThat(courses).isNotEmpty();
        assertThat(courses).containsKey("ANTH 11730");
        assertThat(courses.get("ANTH 11730").getName()).isEqualTo(
                "Decolonizing Anthropology: Africana Critical Theory and the Social Sciences");
        assertThat(courses.get("ANTH 11730").getDescription()).isNotEmpty();
        assertThat(courses.get("ANTH 11730").getSequence()).isNotPresent();
    }

    @Test
    public void getCourses_sequenceParenting() throws IOException {
        Map<String, Course> courses = CollegeCatalog.getCourses(
                "http://collegecatalog.uchicago.edu/thecollege/mathematics/");
        assertThat(courses).isNotEmpty();
        assertThat(courses).containsKey("MATH 15200");
        assertThat(courses.get("MATH 15200").getName()).isEqualTo("Calculus II");
        assertThat(courses.get("MATH 15200").getSequence()).isPresent().contains("MATH 15100-15200-15300");
    }
}