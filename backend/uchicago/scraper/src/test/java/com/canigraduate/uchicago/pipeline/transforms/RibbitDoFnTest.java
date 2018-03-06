package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.PipelineTest;
import com.canigraduate.uchicago.ribbit.Ribbit;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.Optional;

class RibbitDoFnTest extends PipelineTest {
    @Test
    void processElement() throws IOException {
        PCollection<KV<String, Course>> results = this.pipeline.apply(
                Create.of("MATH 15100", "MATH 15300", "nonexistent course")).apply(ParDo.of(new RibbitDoFn()));
        Optional<Course> MATH15100 = Ribbit.getRecordForCourse("MATH 15100");
        Optional<Course> MATH15300 = Ribbit.getRecordForCourse("MATH 15300");
        PAssert.that(results)
                .containsInAnyOrder(KV.of("MATH 15100", MATH15100.get()), KV.of("MATH 15300", MATH15300.get()));
    }

}