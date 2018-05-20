package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.firestore.Sections;
import com.canigraduate.uchicago.firestore.Terms;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.models.Term;
import com.canigraduate.uchicago.pipeline.firestore.PatchCourseDoFn;
import com.canigraduate.uchicago.pipeline.models.TermKey;
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
        PCollection<KV<TermKey, Course>> merged = input.apply("Group by key", GroupByKey.create())
                .apply("Merge courses", MapElements.into(
                        TypeDescriptors.kvs(TypeDescriptor.of(TermKey.class), TypeDescriptor.of(Course.class)))
                        .via(kv -> KV.of(kv.getKey(), Streams.stream(kv.getValue()).reduce(null, Course::create))));
        merged.apply("Remove term association", MapElements.into(INTERMEDIATE)
                .via(e -> KV.of(Objects.requireNonNull(e.getKey()).getCourse(), e.getValue())))
                .apply("Group by key", GroupByKey.create())
                .apply("Merge courses", MapElements.into(INTERMEDIATE)
                        .via(kv -> KV.of(kv.getKey(), Streams.stream(kv.getValue()).reduce(null, Course::create))))
                .apply("Upload courses to Firestore", ParDo.of(new PatchCourseDoFn()));
        merged.apply("Upload terms to Firestore", ParDo.of(new UploadTermDoFn()));
        merged.apply("Map to section ids", MapElements.into(TypeDescriptors.kvs(TypeDescriptor.of(TermKey.class),
                TypeDescriptors.iterables(TypeDescriptors.strings())))
                .via(e -> KV.of(Objects.requireNonNull(e.getKey()), e.getValue().getSections().keySet())))
                .apply("Set section index", ParDo.of(new SetSectionIndexDoFn()));
        merged.apply("Map to course term",
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
            new Terms(termKey.getCourse()).set(termKey.getTerm());
            Sections sections = new Sections(termKey.getCourse(), termKey.getTerm().getTerm());
            // Make sure we delete tombstones too.
            Sets.difference(ImmutableSet.copyOf(sections.list()), course.getSections().keySet())
                    .forEach(sections::delete);
            course.getSections().forEach(sections::set);
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
