package com.canigraduate.uchicago.pipeline.firestore;

import com.canigraduate.uchicago.firestore.Courses;
import com.canigraduate.uchicago.firestore.FirestoreService;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.models.Key;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;

import java.util.Objects;

public class UploadCourseDoFn extends DoFn<KV<Key, Course>, Void> {
    @ProcessElement
    public void processElement(ProcessContext c) {
        Key key = Objects.requireNonNull(c.element().getKey());
        Course course = c.element().getValue();
        // Check if we should upload the course.
        String transaction = FirestoreService.beginTransaction();
        String courseKey = key.getCourse().orElseThrow(() -> new RuntimeException("Missing course"));
        Courses courses = new Courses();
        courses.set(key.getCourse().get(),
                courses.get(courseKey, transaction).map(current -> Course.create(current, course)).orElse(course),
                transaction);
    }
}
