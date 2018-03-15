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
    void getCourses() {
        Map<String, Course> courses = CourseSearch.getCourses("2168", "ARAB");
        assertThat(courses).containsKeys("ARAB 10101", "ARAB 30301", "ARAB 30551");
        assertThat(courses.get("ARAB 10101").getSections()).containsOnlyKeys("1", "2", "3", "4");
        assertThat(courses.get("ARAB 30551").getSections()).containsOnlyKeys("1");
        assertThat(courses.get("ARAB 10101").getSection("1").getNotes()).containsExactly(
                "This class meets 6 hours per week.");
        assertThat(courses.get("ARAB 10101").getSection("1").getEnrollment()).isEqualTo(
                Enrollment.builder().setEnrolled(15).setMaximum(15).build());
        assertThat(courses.get("ARAB 30551").getSection("1").getEnrollment()).isEqualTo(
                Enrollment.builder().setEnrolled(4).setMaximum(18).build());
        assertThat(courses.get("ARAB 30551").getSection("1").getNotes()).containsExactly(
                "Reading knowledge of Arabic (namely three years of Arabic at least) is required; students are expected to read the novels as part of their homework assignment.");
    }

    @Test
    void getCourses_crosslists() {
        Map<String, Course> courses = CourseSearch.getCourses("2184", "EALC");
        assertThat(courses).containsKeys("EALC 11000");
        assertThat(courses.get("EALC 11000").getCrosslists()).containsExactlyInAnyOrder("HIST 15300", "SOSC 23700",
                "CRES 11000");
        assertThat(courses.get("EALC 11000").getSections()).containsKey("1");
        assertThat(courses.get("EALC 11000").getSection("1").getPrimaryActivities()).hasSize(1)
                .allSatisfy(activity -> assertThat(activity.getType()).contains("Lecture"));
        assertThat(courses.get("EALC 11000").getSection("1").getSecondaryActivities()).hasSize(2)
                .allSatisfy(activity -> assertThat(activity.getType()).contains("Discussion"));
    }

    @Test
    void getCourses_cancelledAndSecondaries() {
        Map<String, Course> courses = CourseSearch.getCourses("2168", "MATH");
        assertThat(courses).hasSize(46).containsKeys("MATH 11200");
        assertThat(courses.get("MATH 11200").getSections()).containsOnlyKeys("20", "40");
        assertThat(courses.get("MATH 11200").getSection("20").getEnrollment()).isEqualTo(
                Enrollment.builder().setEnrolled(5).setMaximum(24).build());
        assertThat(courses.get("MATH 11200").getSection("20").getNotes()).containsExactly("Placements");
        assertThat(courses.get("MATH 11200").getSection("20").getSecondaryActivities()).hasSize(3);
    }

    @Test
    void getCourses_edgeCases() {
        assertThat(CourseSearch.getCourses("2178", "HIST")).isNotEmpty();
        assertThat(CourseSearch.getCourses("2178", "EALC")).isNotEmpty();
        assertThat(CourseSearch.getCourses("2184", "BIOS")).isNotEmpty();
    }

}