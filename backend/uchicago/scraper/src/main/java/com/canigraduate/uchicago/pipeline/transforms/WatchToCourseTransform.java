package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.coursesearch.CourseSearch;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.models.Term;
import com.canigraduate.uchicago.models.Watch;
import com.canigraduate.uchicago.pipeline.models.TermKey;
import org.apache.beam.sdk.transforms.FlatMapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptor;
import org.apache.beam.sdk.values.TypeDescriptors;

import java.util.stream.Collectors;

public class WatchToCourseTransform extends
        PTransform<PCollection<KV<String, Watch>>, PCollection<KV<TermKey, Course>>> {
    @Override
    public PCollection<KV<TermKey, Course>> expand(PCollection<KV<String, Watch>> input) {
        return input.apply(FlatMapElements
                .into(TypeDescriptors.kvs(TypeDescriptor.of(TermKey.class), TypeDescriptor.of(Course.class))).via(
                        // e is type Map<String, Watch>
                        e ->
                                CourseSearch.getCoursesFromWatch(e.getValue()).entrySet().stream()
                                        // a is type Map<String, Course>
                                        .map(a -> KV.of(TermKey.builder().setTerm(Term.create(e.getValue()
                                                        .getTerm())).setCourse(e.getValue().getCourse()).build(),
                                                a.getValue())).collect(Collectors.toList())
                ));
    }
}
