package com.canigraduate.uchicago.pipeline.firestore;

import com.canigraduate.uchicago.firestore.Sequences;
import com.canigraduate.uchicago.models.Course;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;

import java.util.Objects;
import java.util.logging.Logger;

/**
 * Upload a course to Firestore.
 */
public class UploadSequenceDoFn extends DoFn<KV<String, Course>, Void> {
    private static final Logger LOGGER = Logger.getLogger(UploadSequenceDoFn.class.getName());

    @ProcessElement
    public void processElement(ProcessContext c) {
        new Sequences().set(Objects.requireNonNull(c.element().getKey()), c.element().getValue());
    }
}
