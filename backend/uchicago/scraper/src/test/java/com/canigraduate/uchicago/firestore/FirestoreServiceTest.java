package com.canigraduate.uchicago.firestore;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.models.Section;
import com.canigraduate.uchicago.models.Term;
import com.canigraduate.uchicago.timeschedules.Timeschedules;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

class FirestoreServiceTest {
    @BeforeEach
    void setUp() {
        FirestoreService.setUChicago(new CollectionReference(null, "institutions").document("uchicago-testing"));
    }

    @AfterEach
    void tearDown() {
        FirestoreService.setUChicago(new CollectionReference(null, "institutions").document("uchicago"));
    }

    @Test
    void test() throws IOException {
        Courses courses = new Courses();
        assertThat(courses.list()).isEmpty();
        courses.set("AKKD 10101", Course.builder()
                .setName("Intro to Akkadian")
                .setDescription("Introduction to the grammar of Akkadian, specifically to the Old Babylonian dialect.")
                .addNote("Instructor(s): John Wee     Terms Offered: AutumnPrerequisite(s): Second-year standing")
                .setParent("AKKD 10101-10102-10103")
                .setPriority(30000)
                .build());
        assertThat(courses.list()).containsExactly("AKKD 10101");
        assertThat(courses.get("AKKD 10101")).contains(Course.builder()
                .setName("Intro to Akkadian")
                .setDescription("Introduction to the grammar of Akkadian, specifically to the Old Babylonian dialect.")
                .addNote("Instructor(s): John Wee     Terms Offered: AutumnPrerequisite(s): Second-year standing")
                .setParent("AKKD 10101-10102-10103")
                .setPriority(30000)
                .build());
        Terms terms = new Terms("AKKD 10101");
        assertThat(terms.list()).isEmpty();
        terms.set(Term.create("Winter 2010"));
        assertThat(terms.list()).containsExactly("Winter 2010");
        assertThat(terms.get("Winter 2010")).contains(Term.create("Winter 2010"));
        // Too lazy to create our own section, just pull from timeschedules lol.
        Section section = Timeschedules.getCourses("http://timeschedules.uchicago.edu/view.php?dept=PHYS&term=81")
                .get("PHYS 13300")
                .getSection("AA");
        Sections sections = new Sections("AKKD 10101", "Winter 2010");
        sections.set("AA", section);
        assertThat(sections.list()).containsExactly("AA");
        assertThat(sections.get("AA")).contains(section);
        courses.delete("AKKD 10101");
        assertThat(courses.list()).isEmpty();
        assertThat(terms.list()).isEmpty();
        assertThat(courses.get("AKKD 10101")).isEmpty();
    }
}