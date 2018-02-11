package com.canigraduate.uchicago.pipeline.firestore;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.canigraduate.uchicago.pipeline.serializers.CourseSerializer;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;

import java.util.logging.Logger;

/**
 * Upload a course to Firestore.
 */
public class UploadSequenceDoFn extends DoFn<KV<Key, Course>, Void> {
    private static final Logger LOGGER = Logger.getLogger(UploadSequenceDoFn.class.getName());

    @ProcessElement
    public void processElement(ProcessContext c) {
        FirestoreService.getUChicago()
                .collection("sequence")
                .document(c.element().getKey().getCourse().orElseThrow(() -> new RuntimeException("Missing course")))
                .set(new CourseSerializer().apply(c.element().getValue()));
    }
}
