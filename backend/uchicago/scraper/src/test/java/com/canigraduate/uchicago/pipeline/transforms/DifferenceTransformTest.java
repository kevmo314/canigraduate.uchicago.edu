package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.pipeline.PipelineTest;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionList;
import org.junit.jupiter.api.Test;

class DifferenceTransformTest extends PipelineTest {

    @Test
    void expand() {
        PCollection<Integer> a = this.pipeline.apply("Create Minuend", Create.of(1, 2, 3, 4, 5, 5));
        PCollection<Integer> b = this.pipeline.apply("Create Subtrahend", Create.of(2, 3, 4, 6, 7, 8));
        PCollection<Integer> c = PCollectionList.of(a).and(b).apply(new DifferenceTransform<>());
        PAssert.that(c).containsInAnyOrder(1, 5);
    }
}