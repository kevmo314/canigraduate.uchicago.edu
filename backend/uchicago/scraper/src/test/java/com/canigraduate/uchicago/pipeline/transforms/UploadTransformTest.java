package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.firestore.*;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.models.Enrollment;
import com.canigraduate.uchicago.models.Section;
import com.canigraduate.uchicago.models.Term;
import com.canigraduate.uchicago.pipeline.ModelSubtypeCoderProvider;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.canigraduate.uchicago.timeschedules.Timeschedules;
import org.apache.beam.sdk.testing.TestPipeline;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.values.KV;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.IOException;
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
    void processElement() throws IOException {
        TestPipeline pipeline = TestPipeline.create().enableAbandonedNodeEnforcement(false);
        pipeline.getCoderRegistry().registerCoderProvider(new ModelSubtypeCoderProvider());
        Map<String, Course> timeschedules = Timeschedules.getCourses(
                "http://timeschedules.uchicago.edu/view.php?dept=PHYS&term=81");
        assertThat(timeschedules).containsKeys("PHYS 13300", "PHYS 14300");
        pipeline.apply(Create.of(KV.of(Key.builder()
                .setCourse("PHYS 13300")
                .setTerm(Term.create("Spring 2010"))
                .setDepartment("PHYS")
                .build(), timeschedules.get("PHYS 13300")), KV.of(Key.builder()
                .setCourse("PHYS 14300")
                .setTerm(Term.create("Spring 2010"))
                .setDepartment("PHYS")
                .build(), timeschedules.get("PHYS 14300")))).apply("Upload courses", new UploadTransform());
        pipeline.run();

        Courses courses = new Courses();
        assertThat(courses.list()).containsExactly("PHYS 13300", "PHYS 14300");
        Terms terms = new Terms("PHYS 13300");
        assertThat(terms.list()).containsExactly("Spring 2010");
        assertThat(terms.get("Spring 2010")).contains(Term.create("Spring 2010"));
        Sections sections = new Sections("PHYS 13300", "Spring 2010");
        assertThat(sections.list()).containsExactly("AA", "BB");
        assertThat(sections.get("AA")).contains(timeschedules.get("PHYS 13300").getSection("AA"));

        // Delete BB.
        sections.delete("BB");
        assertThat(sections.list()).containsExactly("AA");

        // Create a fake CC.
        sections.set("CC", Section.builder().setEnrollment(Enrollment.builder().build()).build());
        assertThat(sections.list()).containsExactly("AA", "CC");

        // Run again.
        pipeline.run();

        // Check that it was recreated.
        assertThat(sections.list()).containsExactly("AA", "BB");

        courses.delete("PHYS 13300");
        courses.delete("PHYS 14300");

        assertThat(courses.list()).isEmpty();
    }
}