package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.models.Key;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptor;

import java.util.Objects;

public class AssignPriorityTransform extends PTransform<PCollection<KV<Key, Course>>, PCollection<KV<Key, Course>>> {
    private static final TypeDescriptor<KV<Key, Course>> INTERMEDIATE = new TypeDescriptor<KV<Key, Course>>() {
    };

    @Override
    public PCollection<KV<Key, Course>> expand(PCollection<KV<Key, Course>> input) {
        return input.apply(MapElements.into(INTERMEDIATE)
                .via(e -> KV.of(e.getKey(), e.getValue()
                        .withPriority(Objects.requireNonNull(e.getKey())
                                .getTerm()
                                .orElseThrow(() -> new IllegalStateException("Missing term"))
                                .getOrdinal()))));
    }
}
