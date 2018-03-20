package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.models.TermKey;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptor;

import java.util.Objects;

public class AssignPriorityTransform
        extends PTransform<PCollection<KV<TermKey, Course>>, PCollection<KV<TermKey, Course>>> {
    private static final TypeDescriptor<KV<TermKey, Course>> INTERMEDIATE = new TypeDescriptor<KV<TermKey, Course>>() {
    };

    @Override
    public PCollection<KV<TermKey, Course>> expand(PCollection<KV<TermKey, Course>> input) {
        return input.apply(MapElements.into(INTERMEDIATE)
                .via(e -> KV.of(e.getKey(), e.getValue()
                        .withPriority(Objects.requireNonNull(e.getKey())
                                .getTerm()
                                .getOrdinal()))));
    }
}
