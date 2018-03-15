package com.canigraduate.uchicago.pipeline;

import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.values.PCollection;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ReduceElementsTest extends PipelineTest {

    @Test
    void expand() {
        PCollection<Integer> input = this.pipeline.apply("Create data", Create.of(5, 4, 3, 2, 1));
        PCollection<Iterable<Integer>> result = input.apply(new ReduceElements<>());
        PAssert.that(result).satisfies(data -> {
            assertThat(data).hasSize(1);
            assertThat(data.iterator().next()).containsExactlyInAnyOrder(1, 2, 3, 4, 5);
            return null;
        });
    }
}