package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.firestore.FirestoreService;
import com.canigraduate.uchicago.firestore.Sections;
import com.canigraduate.uchicago.firestore.Terms;
import com.canigraduate.uchicago.firestore.models.Write;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.firestore.SetCourseDoFn;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableSet;
import com.google.common.collect.Sets;
import com.google.common.collect.Streams;
import org.apache.beam.sdk.transforms.*;
import org.apache.beam.sdk.values.*;

import java.util.Objects;

/**
 * Upload a course to Firestore.
 */
public class UploadTransform extends PTransform<PCollection<KV<Key, Course>>, PDone> {
    private static final TypeDescriptor<KV<String, Course>> INTERMEDIATE = TypeDescriptors.kvs(
            TypeDescriptors.strings(), TypeDescriptor.of(Course.class));

    @Override
    public PDone expand(PCollection<KV<Key, Course>> input) {
        // Group by course first to reduce datastore contention.
        input.apply("Remove term association", MapElements.into(INTERMEDIATE)
                .via(e -> KV.of(Objects.requireNonNull(e.getKey()).getCourse(), e.getValue())))
                .apply("Group by key", GroupByKey.create())
                .apply("Merge courses", MapElements.into(INTERMEDIATE)
                        .via(kv -> KV.of(kv.getKey(), Streams.stream(kv.getValue()).reduce(null, Course::create))))
                .apply("Upload courses to Firestore", ParDo.of(new SetCourseDoFn()));
        input.apply("Upload terms to Firestore", ParDo.of(new UploadTermDoFn()));
        return PDone.in(input.getPipeline());
    }

    class UploadTermDoFn extends DoFn<KV<Key, Course>, Void> {
        @ProcessElement
        public void processElement(ProcessContext c) {
            Key key = Objects.requireNonNull(c.element().getKey());
            Course course = c.element().getValue();
            String transaction = FirestoreService.beginTransaction();
            new Terms(key.getCourse()).set(key.getTerm());
            // Tombstones are somewhat of an issue, so we need to pull the sections in the db first and delete them in
            // one transaction.
            Sections sections = new Sections(key.getCourse(), key.getTerm().getTerm());
            ImmutableList.Builder<Write> writeBuilder = new ImmutableList.Builder<>();
            Sets.difference(ImmutableSet.copyOf(sections.list(transaction)), course.getSections().keySet())
                    .forEach(sectionId -> writeBuilder.add(sections.getDeleteWrite(sectionId)));
            course.getSections().forEach((key1, value) -> writeBuilder.add(sections.getSetWrite(key1, value)));
            FirestoreService.commit(writeBuilder.build(), transaction);
        }
    }
}
