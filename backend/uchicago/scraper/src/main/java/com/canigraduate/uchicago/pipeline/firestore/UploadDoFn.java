package com.canigraduate.uchicago.pipeline.firestore;

import com.canigraduate.uchicago.firestore.Courses;
import com.canigraduate.uchicago.firestore.FirestoreService;
import com.canigraduate.uchicago.firestore.Sections;
import com.canigraduate.uchicago.firestore.Terms;
import com.canigraduate.uchicago.firestore.models.Write;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableSet;
import com.google.common.collect.Sets;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;

import java.util.Objects;

/**
 * Upload a course to Firestore.
 */
public class UploadDoFn extends DoFn<KV<Key, Course>, Void> {

    @ProcessElement
    public void processElement(ProcessContext c) {
        Key key = Objects.requireNonNull(c.element().getKey());
        Course course = c.element().getValue();
        // Check if we should upload the course.
        String transaction = FirestoreService.beginTransaction();
        Courses courses = new Courses();
        courses.set(key.getCourse(),
                courses.get(key.getCourse(), transaction).map(current -> Course.create(current, course)).orElse(course),
                transaction);
        if (course.getSections().isEmpty()) {
            // If sections is empty, this course is just metadata.
            return;
        }
        new Terms(key.getCourse()).set(key.getTerm());
        // Tombstones are somewhat of an issue, so we need to pull the sections in the db first and delete them in
        // one transaction.
        String sectionTransaction = FirestoreService.beginTransaction();
        Sections sections = new Sections(key.getCourse(), key.getTerm().getTerm());
        ImmutableList.Builder<Write> writeBuilder = new ImmutableList.Builder<>();
        Sets.difference(ImmutableSet.copyOf(sections.list(sectionTransaction)), course.getSections().keySet())
                .forEach(sectionId -> writeBuilder.add(sections.getDeleteWrite(sectionId)));
        course.getSections().forEach((key1, value) -> writeBuilder.add(sections.getSetWrite(key1, value)));
        FirestoreService.commit(writeBuilder.build(), sectionTransaction);
    }
}
