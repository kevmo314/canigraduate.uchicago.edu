package com.canigraduate.uchicago.pipeline.firestore;

import com.canigraduate.uchicago.firestore.Sequences;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.models.Key;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;

import java.util.Objects;
import java.util.logging.Logger;

/**
 * Upload a course to Firestore.
 */
public class UploadSequenceDoFn extends DoFn<KV<Key, Course>, Void> {
    private static final Logger LOGGER = Logger.getLogger(UploadSequenceDoFn.class.getName());

    @ProcessElement
    public void processElement(ProcessContext c) {
        new Sequences().set(Objects.requireNonNull(c.element().getKey())
                .getCourse()
                .orElseThrow(() -> new IllegalStateException("Missing sequence identifier.")), c.element().getValue());
    }
}
