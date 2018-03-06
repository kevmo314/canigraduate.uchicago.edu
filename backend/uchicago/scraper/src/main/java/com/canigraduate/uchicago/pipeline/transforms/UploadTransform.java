package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.firestore.FirestoreService;
import com.canigraduate.uchicago.firestore.Sections;
import com.canigraduate.uchicago.firestore.Terms;
import com.canigraduate.uchicago.firestore.models.Write;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.models.Term;
import com.canigraduate.uchicago.pipeline.firestore.UploadCourseDoFn;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableSet;
import com.google.common.collect.Sets;
import com.google.common.collect.Streams;
import org.apache.beam.sdk.transforms.*;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PDone;
import org.apache.beam.sdk.values.TypeDescriptor;

import java.util.Objects;
import java.util.logging.Logger;

/**
 * Upload a course to Firestore.
 */
public class UploadTransform extends PTransform<PCollection<KV<Key, Course>>, PDone> {
    private static final Logger LOGGER = Logger.getLogger(UploadTransform.class.getName());
    private static final TypeDescriptor<KV<Key, Course>> INTERMEDIATE = new TypeDescriptor<KV<Key, Course>>() {
    };

    @Override
    public PDone expand(PCollection<KV<Key, Course>> input) {
        // Group by course first to reduce datastore contention.
        PCollection<KV<Key, Course>> courses = input.apply("Filter keys with courses",
                Filter.by(element -> Objects.requireNonNull(element.getKey()).getCourse().isPresent()));
        courses.apply("Remove term association", MapElements.into(INTERMEDIATE)
                .via(e -> KV.of(Key.builder().setCourse(Objects.requireNonNull(e.getKey()).getCourse().get()).build(),
                        e.getValue())))
                .apply("Group by key", GroupByKey.create())
                .apply("Merge courses", MapElements.into(INTERMEDIATE)
                        .via(e -> KV.of(e.getKey(), Streams.stream(e.getValue()).reduce(null, Course::create))))
                .apply("Upload courses to Firestore", ParDo.of(new UploadCourseDoFn()));
        courses.apply("Filter keys with terms",
                Filter.by(element -> Objects.requireNonNull(element.getKey()).getTerm().isPresent()))
                .apply("Upload terms to Firestore", ParDo.of(new UploadTermDoFn()));
        return PDone.in(input.getPipeline());
    }

    class UploadTermDoFn extends DoFn<KV<Key, Course>, Void> {
        @ProcessElement
        public void processElement(ProcessContext c) {
            Key key = Objects.requireNonNull(c.element().getKey());
            Course course = c.element().getValue();
            String transaction = FirestoreService.beginTransaction();
            String courseKey = key.getCourse().orElseThrow(() -> new RuntimeException("Missing course"));
            Term term = key.getTerm().orElseThrow(() -> new RuntimeException("Missing term for non-metadata course."));
            new Terms(courseKey).set(term);
            // Tombstones are somewhat of an issue, so we need to pull the sections in the db first and delete them in
            // one transaction.
            Sections sections = new Sections(courseKey, term.getTerm());
            ImmutableList.Builder<Write> writeBuilder = new ImmutableList.Builder<>();
            Sets.difference(ImmutableSet.copyOf(sections.list(transaction)), course.getSections().keySet())
                    .forEach(sectionId -> writeBuilder.add(sections.getDeleteWrite(sectionId)));
            course.getSections().forEach((key1, value) -> writeBuilder.add(sections.getSetWrite(key1, value)));
            FirestoreService.commit(writeBuilder.build(), transaction);
        }
    }
}
