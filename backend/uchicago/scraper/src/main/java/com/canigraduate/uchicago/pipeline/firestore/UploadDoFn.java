package com.canigraduate.uchicago.pipeline.firestore;

import com.canigraduate.uchicago.firestore.Courses;
import com.canigraduate.uchicago.firestore.FirestoreService;
import com.canigraduate.uchicago.firestore.Sections;
import com.canigraduate.uchicago.firestore.Terms;
import com.canigraduate.uchicago.firestore.models.Write;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.models.Term;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableSet;
import com.google.common.collect.Sets;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;

import java.util.Objects;
import java.util.logging.Logger;

/**
 * Upload a course to Firestore.
 */
public class UploadDoFn extends DoFn<KV<Key, Course>, Void> {
    private static final Logger LOGGER = Logger.getLogger(UploadDoFn.class.getName());

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
        if (course.getSections().isEmpty()) {
            // If sections is empty, this course is just metadata.
            return;
        }
        Term term = key.getTerm().orElseThrow(() -> new RuntimeException("Missing term for non-metadata course."));
        new Terms(courseKey).set(term);
        // Tombstones are somewhat of an issue, so we need to pull the sections in the db first and delete them in
        // one transaction.
        String sectionTransaction = FirestoreService.beginTransaction();
        Sections sections = new Sections(courseKey, term.getTerm());
        ImmutableList.Builder<Write> writeBuilder = new ImmutableList.Builder<>();
        Sets.difference(ImmutableSet.copyOf(sections.list(sectionTransaction)), course.getSections().keySet())
                .forEach(sectionId -> writeBuilder.add(sections.getDeleteWrite(sectionId)));
        course.getSections().forEach((key1, value) -> writeBuilder.add(sections.getSetWrite(key1, value)));
        FirestoreService.commit(writeBuilder.build(), sectionTransaction);
    }
}
