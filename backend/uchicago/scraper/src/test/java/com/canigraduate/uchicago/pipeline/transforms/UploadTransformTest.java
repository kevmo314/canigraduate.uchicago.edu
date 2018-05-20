package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.coursesearch.CourseSearch;
import com.canigraduate.uchicago.firestore.*;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.models.Enrollment;
import com.canigraduate.uchicago.models.Section;
import com.canigraduate.uchicago.models.Term;
import com.canigraduate.uchicago.pipeline.ModelSubtypeCoderProvider;
import com.canigraduate.uchicago.pipeline.models.TermKey;
import com.canigraduate.uchicago.timeschedules.Timeschedules;
import org.apache.beam.sdk.testing.TestPipeline;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.values.KV;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class UploadTransformTest {
    @BeforeAll
    static void beforeAll() {
        FirestoreService.setUChicago(new CollectionReference(null, "institutions").document("uchicago-testing"));
    }

    @AfterAll
    static void afterAll() {
        FirestoreService.setUChicago(new CollectionReference(null, "institutions").document("uchicago"));
    }

    @Test
    void processElement() throws Exception {
        TestPipeline pipeline = TestPipeline.create().enableAbandonedNodeEnforcement(false);
        pipeline.getCoderRegistry().registerCoderProvider(new ModelSubtypeCoderProvider());
        Map<String, Course> timeschedules = Timeschedules.getCourses(
                "http://timeschedules.uchicago.edu/view.php?dept=PHYS&term=81");
        assertThat(timeschedules).containsKeys("PHYS 13300", "PHYS 14300");
        pipeline.apply(Create.of(
                KV.of(TermKey.builder().setCourse("PHYS 13300").setTerm(Term.create("Spring 2010")).build(),
                        timeschedules.get("PHYS 13300")),
                KV.of(TermKey.builder().setCourse("PHYS 14300").setTerm(Term.create("Spring 2010")).build(),
                        timeschedules.get("PHYS 14300")))).apply("Upload courses", new UploadTransform());
        pipeline.run();

        Courses courses = new Courses();
        assertThat(courses.list()).containsExactly("PHYS 13300", "PHYS 14300");
        Terms terms = new Terms("PHYS 13300");
        assertThat(terms.list()).containsExactly("Spring 2010");
        assertThat(terms.listFromParent()).containsExactly("Spring 2010");
        assertThat(terms.get("Spring 2010")).contains(Term.create("Spring 2010"));
        Sections sections = new Sections("PHYS 13300", "Spring 2010");
        assertThat(sections.list()).containsExactly("AA", "BB");
        assertThat(sections.listFromParent()).containsExactly("AA", "BB");
        assertThat(sections.get("AA")).contains(timeschedules.get("PHYS 13300").getSection("AA"));

        // Delete BB.
        sections.delete("BB");
        assertThat(sections.list()).containsExactly("AA");
        assertThat(sections.listFromParent()).containsExactly("AA");

        // Create a fake CC.
        sections.set("CC", Section.builder().setEnrollment(Enrollment.builder().build()).build());
        assertThat(sections.list()).containsExactly("AA", "CC");
        // Index should not be updated.
        assertThat(sections.listFromParent()).containsExactly("AA");

        // Run again.
        pipeline.run();

        // Check that it was recreated.
        assertThat(sections.list()).containsExactly("AA", "BB");
        assertThat(sections.listFromParent()).containsExactly("AA", "BB");

        courses.delete("PHYS 13300");
        courses.delete("PHYS 14300");

        assertThat(courses.list()).isEmpty();
    }

    @Test
    void test_MATH15100() throws Exception {
        FirestoreService.setUChicago(new CollectionReference(null, "institutions").document("uchicago"));
        TestPipeline pipeline = TestPipeline.create().enableAbandonedNodeEnforcement(false);
        pipeline.getCoderRegistry().registerCoderProvider(new ModelSubtypeCoderProvider());
        Map<String, Course> courses = CourseSearch.getCourses("2188", "MATH");
        pipeline.apply(Create.of(
                KV.of(TermKey.builder().setCourse("MATH 15100").setTerm(Term.create("Autumn 2018")).build(),
                        courses.get("MATH 15100").withPriority(Term.create("Autumn 2018").getOrdinal()))))
                .apply("Upload courses", new UploadTransform());
        pipeline.run();
    }
}