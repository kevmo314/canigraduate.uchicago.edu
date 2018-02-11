package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.PipelineTest;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.canigraduate.uchicago.ribbit.Ribbit;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.Optional;

public class RibbitDoFnTest extends PipelineTest {
    @Test
    public void processElement() throws IOException {
        PCollection<KV<Key, Course>> results = this.pipeline.apply(
                Create.of(Key.builder().setCourse("MATH 15100").build(), Key.builder().setCourse("MATH 15300").build(),
                        Key.builder().setCourse("nonexistent course").build())).apply(ParDo.of(new RibbitDoFn()));
        Optional<Course> MATH15100 = Ribbit.getRecordForCourse("MATH 15100");
        Optional<Course> MATH15300 = Ribbit.getRecordForCourse("MATH 15300");
        PAssert.that(results)
                .containsInAnyOrder(KV.of(Key.builder().setCourse("MATH 15100").build(), MATH15100.get()),
                        KV.of(Key.builder().setCourse("MATH 15300").build(), MATH15300.get()));
    }

}