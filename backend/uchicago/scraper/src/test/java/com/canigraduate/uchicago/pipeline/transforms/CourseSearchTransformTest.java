package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.pipeline.PipelineTest;
import org.junit.jupiter.api.Test;

class CourseSearchTransformTest extends PipelineTest {
    @Test
    void processElement() {
        /*PCollection<KV<Key, Course>> results = this.pipeline.apply(new CourseSearchTransform());
        PAssert.that(results).satisfies(records -> {
            assertThat(records).isNotEmpty();
            return null;
        });*/
    }
}