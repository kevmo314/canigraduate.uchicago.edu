package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.PipelineTest;
import com.canigraduate.uchicago.pipeline.models.Key;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CourseSearchTransformTest extends PipelineTest {
    @Test
    void processElement() {
        PCollection<KV<Key, Course>> results = this.pipeline.apply(new CourseSearchTransform());
        PAssert.that(results).satisfies(records -> {
            assertThat(records).isNotEmpty();
            return null;
        });
    }
}