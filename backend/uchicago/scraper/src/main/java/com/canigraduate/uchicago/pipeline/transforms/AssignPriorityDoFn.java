package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.models.Key;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;

import java.util.Objects;

public class AssignPriorityDoFn extends DoFn<KV<Key, Course>, KV<Key, Course>> {
    @ProcessElement
    public void processElement(ProcessContext c) {
        int priority = Objects.requireNonNull(c.element().getKey())
                .getTerm()
                .orElseThrow(() -> new IllegalStateException("Missing term"))
                .getOrdinal();
        c.output(KV.of(c.element().getKey(), c.element().getValue().withPriority(priority)));
    }
}
