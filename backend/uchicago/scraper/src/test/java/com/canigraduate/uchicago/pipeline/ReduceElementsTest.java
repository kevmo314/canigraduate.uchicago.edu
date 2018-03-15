package com.canigraduate.uchicago.pipeline;

import com.google.common.collect.Streams;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptors;
import org.junit.jupiter.api.Test;

class ReduceElementsTest extends PipelineTest {

    @Test
    void expand() {
        PCollection<Integer> input = this.pipeline.apply("Create data", Create.of(5, 4, 3, 2, 1));
        PCollection<Integer> result = input.apply(ReduceElements.into(TypeDescriptors.integers())
                .via(values -> Streams.stream(values).reduce(0, (x, y) -> x + y)));
        PAssert.that(result).containsInAnyOrder(15);
    }
}