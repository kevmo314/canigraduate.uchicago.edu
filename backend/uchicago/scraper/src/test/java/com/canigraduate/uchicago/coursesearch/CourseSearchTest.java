package com.canigraduate.uchicago.coursesearch;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.models.Enrollment;
import com.canigraduate.uchicago.models.Term;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class CourseSearchTest {

    @Test
    void getTerms() throws IOException {
        Map<Term, String> terms = CourseSearch.getTerms();
        assertThat(terms).isNotEmpty().containsEntry(Term.create("Autumn 2016"), "2168");
    }

    @Test
    void getDepartments() throws IOException {
        Map<String, String> departments = CourseSearch.getDepartments("2168");
        assertThat(departments).hasSize(200).containsEntry("AANL", "AANL");
    }

    @Test
    void getDepartments_summer2017() throws IOException {
        Map<String, String> departments = CourseSearch.getDepartments("2176");
        assertThat(departments).hasSize(144);
    }

    @Test
    void getCourses() throws IOException {
        Map<String, Course> courses = CourseSearch.getCourses("2168", "ARAB", 0);
        assertThat(courses).containsOnlyKeys("ARAB 10101", "ARAB 30551");
        assertThat(courses.get("ARAB 10101").getSections()).containsOnlyKeys("1");
        assertThat(courses.get("ARAB 30551").getSections()).containsOnlyKeys("1");
        assertThat(courses.get("ARAB 10101").getSection("1").getNotes()).containsExactly(
                "This class meets 6 hours per week.");
        assertThat(courses.get("ARAB 10101").getSection("1").getEnrollment()).isEqualTo(
                Enrollment.builder().setEnrolled(15).setMaximum(15).build());
        assertThat(courses.get("ARAB 30551").getSection("1").getNotes()).isEmpty();
    }

    @Test
    void getCourses_shards() throws IOException {
        assertThat(CourseSearch.getCourses("2168", "ARAB", 1)).containsOnlyKeys("ARAB 10101");
        assertThat(CourseSearch.getCourses("2168", "ARAB", 22)).containsOnlyKeys("ARAB 30301");
    }

    @Test
    void getCourses_cancelledAndSecondaries() throws IOException {
        Map<String, Course> courses = CourseSearch.getCourses("2168", "MATH", 0);
        assertThat(courses).hasSize(5).containsKeys("MATH 11200");
        assertThat(courses.get("MATH 11200").getSections()).containsOnlyKeys("20");
        assertThat(courses.get("MATH 11200").getSection("20").getEnrollment()).isEqualTo(
                Enrollment.builder().setEnrolled(5).setMaximum(24).build());
        assertThat(courses.get("MATH 11200").getSection("20").getNotes()).containsExactly("Placements");
        assertThat(courses.get("MATH 11200").getSection("20").getSecondaryActivities()).hasSize(3);
    }

    @Test
    void getCourses_edgeCases() throws IOException {
        assertThat(CourseSearch.getCourses("2178", "HIST", 16)).isNotEmpty();
        assertThat(CourseSearch.getCourses("2178", "EALC", 19)).isNotEmpty();
        assertThat(CourseSearch.getCourses("2184", "BIOS", 10)).isNotEmpty();
    }

}