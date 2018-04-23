package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.firestore.FirestoreService;
import com.canigraduate.uchicago.firestore.Sections;
import com.canigraduate.uchicago.firestore.Terms;
import com.canigraduate.uchicago.firestore.models.Write;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.models.Term;
import com.canigraduate.uchicago.pipeline.firestore.PatchCourseDoFn;
import com.canigraduate.uchicago.pipeline.models.TermKey;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableSet;
import com.google.common.collect.Sets;
import com.google.common.collect.Streams;
import org.apache.beam.sdk.transforms.*;
import org.apache.beam.sdk.values.*;

import java.util.Comparator;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Upload a course to Firestore.
 */
public class UploadTransform extends PTransform<PCollection<KV<TermKey, Course>>, PDone> {
    private static final TypeDescriptor<KV<String, Course>> INTERMEDIATE = TypeDescriptors.kvs(
            TypeDescriptors.strings(), TypeDescriptor.of(Course.class));

    @Override
    public PDone expand(PCollection<KV<TermKey, Course>> input) {
        // Group by course first to reduce datastore contention.
        input.apply("Remove term association", MapElements.into(INTERMEDIATE)
                .via(e -> KV.of(Objects.requireNonNull(e.getKey()).getCourse(), e.getValue())))
                .apply("Group by key", GroupByKey.create())
                .apply("Merge courses", MapElements.into(INTERMEDIATE)
                        .via(kv -> KV.of(kv.getKey(), Streams.stream(kv.getValue()).reduce(null, Course::create))))
                .apply("Upload courses to Firestore", ParDo.of(new PatchCourseDoFn()));
        input.apply("Upload terms to Firestore", ParDo.of(new UploadTermDoFn()));
        input.apply("Map to course term section",
                FlatMapElements.into(TypeDescriptors.kvs(TypeDescriptor.of(TermKey.class), TypeDescriptors.strings()))
                        .via(e -> e.getValue()
                                .getSections()
                                .keySet()
                                .stream()
                                .map(section -> KV.of(Objects.requireNonNull(e.getKey()), section))
                                .collect(Collectors.toList())))
                .apply("Group by course term", GroupByKey.create())
                .apply("Set section index", ParDo.of(new SetSectionIndexDoFn()));
        input.apply("Map to course term",
                MapElements.into(TypeDescriptors.kvs(TypeDescriptors.strings(), TypeDescriptor.of(Term.class)))
                        .via(e -> {
                            TermKey termKey = Objects.requireNonNull(e.getKey());
                            return KV.of(termKey.getCourse(), termKey.getTerm());
                        }))
                .apply("Group by course", GroupByKey.create())
                .apply("Set term index", ParDo.of(new SetTermIndexDoFn()));
        return PDone.in(input.getPipeline());
    }

    class UploadTermDoFn extends DoFn<KV<TermKey, Course>, Void> {
        @ProcessElement
        public void processElement(ProcessContext c) {
            TermKey termKey = Objects.requireNonNull(c.element().getKey());
            Course course = c.element().getValue();
            String transaction = FirestoreService.beginTransaction();
            new Terms(termKey.getCourse()).set(termKey.getTerm());
            // Tombstones are somewhat of an issue, so we need to pull the sections in the db first and delete them in
            // one transaction.
            Sections sections = new Sections(termKey.getCourse(), termKey.getTerm().getTerm());
            ImmutableList.Builder<Write> writeBuilder = new ImmutableList.Builder<>();
            Sets.difference(ImmutableSet.copyOf(sections.list(transaction)), course.getSections().keySet())
                    .forEach(sectionId -> writeBuilder.add(sections.getDeleteWrite(sectionId)));
            course.getSections().forEach((key, value) -> writeBuilder.add(sections.getSetWrite(key, value)));
            FirestoreService.commit(writeBuilder.build(), transaction);
        }
    }

    class SetSectionIndexDoFn extends DoFn<KV<TermKey, Iterable<String>>, Void> {
        @ProcessElement
        public void processElement(ProcessContext c) {
            TermKey termKey = Objects.requireNonNull(c.element().getKey());
            new Sections(termKey.getCourse(), termKey.getTerm().getTerm()).setSectionIndex(
                    Streams.stream(c.element().getValue()).sorted().distinct().collect(Collectors.toList()));
        }
    }

    class SetTermIndexDoFn extends DoFn<KV<String, Iterable<Term>>, Void> {
        @ProcessElement
        public void processElement(ProcessContext c) {
            String course = Objects.requireNonNull(c.element().getKey());
            new Terms(course).setTermIndex(Streams.stream(c.element().getValue())
                    .sorted(Comparator.reverseOrder())
                    .distinct()
                    .map(Term::getTerm)
                    .collect(Collectors.toList()));
        }
    }
}
