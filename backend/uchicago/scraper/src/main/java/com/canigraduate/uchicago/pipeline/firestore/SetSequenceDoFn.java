package com.canigraduate.uchicago.pipeline.firestore;

import com.canigraduate.uchicago.firestore.Sequences;
import com.canigraduate.uchicago.models.Course;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;

import java.util.Objects;

/**
 * Upload a course to Firestore.
 */
public class SetSequenceDoFn extends DoFn<KV<String, Course>, Void> {

    @ProcessElement
    public void processElement(ProcessContext c) {
        new Sequences().set(Objects.requireNonNull(c.element().getKey()), c.element().getValue());
    }
}
