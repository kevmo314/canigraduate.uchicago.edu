package com.canigraduate.uchicago.pipeline.firestore;

import com.canigraduate.uchicago.pipeline.PipelineTest;
import org.junit.jupiter.api.Test;

class CardinalityWriteReduceFnTest extends PipelineTest {
    @Test
    void test() {/*
        PCollection<String> results = this.pipeline.apply(Create.of(KV.of(Key.builder()
                .setCourse("MATH 15100")
                .setTerm(Term.create("Winter 2018"))
                .setDepartment("MATH")
                .build(), 1), KV.of(Key.builder()
                .setCourse("PHYS 15100")
                .setTerm(Term.create("Winter 2018"))
                .setDepartment("PHYS")
                .build(), 4), KV.of(Key.builder()
                .setCourse("ECON 15100")
                .setTerm(Term.create("Autumn 2018"))
                .setDepartment("ECON")
                .build(), 10)))
                .apply(ReduceElements.into(TypeDescriptors.strings()).via(new CardinalityWriteReduceFn()));
        PAssert.that(results).satisfies(output -> {
            assertThat(output).hasSize(1);
            return null;
        });*/
    }

}