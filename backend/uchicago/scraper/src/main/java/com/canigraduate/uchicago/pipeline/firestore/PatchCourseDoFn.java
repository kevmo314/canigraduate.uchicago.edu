package com.canigraduate.uchicago.pipeline.firestore;

import com.canigraduate.uchicago.firestore.Courses;
import com.canigraduate.uchicago.firestore.FirestoreService;
import com.canigraduate.uchicago.models.Course;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;

import java.util.Objects;

public class SetCourseDoFn extends DoFn<KV<String, Course>, Void> {
    @ProcessElement
    public void processElement(ProcessContext c) {
        String courseKey = Objects.requireNonNull(c.element().getKey());
        Course course = c.element().getValue();
        String transaction = FirestoreService.beginTransaction();
        Courses courses = new Courses();
        courses.set(courseKey, courses.get(courseKey, transaction)
                        .map(current -> Course.create(current, course))
                        .orElse(course),
                transaction);
    }
}
