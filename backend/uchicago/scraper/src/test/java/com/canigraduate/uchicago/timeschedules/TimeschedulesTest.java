package com.canigraduate.uchicago.timeschedules;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.models.Term;
import org.junit.Test;

import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

public class TimeschedulesTest {
    @Test
    public void getTerms() throws IOException {
        Map<Term, String> terms = Timeschedules.getTerms();
        assertThat(terms).isNotEmpty();
        assertThat(terms.keySet().stream().min(Term::compareTo)).isPresent().contains(Term.create("Autumn 2002"));
        assertThat(terms.get(Term.create("Autumn 2002"))).isEqualTo("46");
    }

    @Test
    public void getDepartments() throws IOException {
        Map<String, String> departments = Timeschedules.getDepartments("27");
        assertThat(departments).isNotEmpty();
        assertThat(departments).containsKey("ANCC");
        assertThat(departments.get("ANCC")).isEqualTo("http://timeschedules.uchicago.edu/view.php?dept=ANCC&term=27");
    }

    @Test
    public void getCourses() throws IOException {
        Map<String, Course> courses = Timeschedules.getCourses(
                "http://timeschedules.uchicago.edu/view.php?dept=CMST&term=27");
        assertThat(courses).hasSize(2);
        assertThat(courses).containsKey("CMST 27600");
        assertThat(courses).containsKey("CMST 37600");
        assertThat(courses.get("CMST 27600").getSections()).containsKey("91");
        assertThat(courses.get("CMST 37600").getSections()).containsKey("91");
        assertThat(courses.get("CMST 27600").getSection("91").getNotes()).containsExactly(
                "Course meets " + "7/11-7-29 (3 weeks).");
        assertThat(courses.get("CMST 37600").getSection("91").getNotes()).containsExactly(
                "Course meets " + "7/11-7-29 (3 weeks).");
    }

    @Test
    public void getCourses_physics() throws IOException {
        Map<String, Course> courses = Timeschedules.getCourses(
                "http://timeschedules.uchicago.edu/view.php?dept=PHYS&term=81");
        assertThat(courses).hasSize(24);
        assertThat(courses).containsKey("PHYS 13300");
        assertThat(courses.get("PHYS 13300").getSections()).containsOnlyKeys("AA", "BB");
        assertThat(courses.get("PHYS 13300").getSection("AA").getPrimaryActivities()).hasSize(2);
        assertThat(courses.get("PHYS 13300").getSection("BB").getPrimaryActivities()).hasSize(2);
        assertThat(courses.get("PHYS 13300").getSection("AA").getSecondaryActivities()).hasSize(5);
        assertThat(courses.get("PHYS 13300").getSection("BB").getSecondaryActivities()).hasSize(4);
    }
}