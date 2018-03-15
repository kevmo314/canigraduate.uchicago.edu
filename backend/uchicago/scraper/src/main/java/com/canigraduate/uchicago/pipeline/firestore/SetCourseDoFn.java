package com.canigraduate.uchicago.pipeline.firestore;

import com.canigraduate.uchicago.firestore.Courses;
import com.canigraduate.uchicago.models.Course;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;

import java.util.Objects;

public class SetCourseDoFn extends DoFn<KV<String, Course>, Void> {
    @ProcessElement
    public void processElement(ProcessContext c) {
        new Courses().set(Objects.requireNonNull(c.element().getKey()), c.element().getValue());
    }
}
