package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.coursesearch.CourseSearch;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.models.Watch;
import org.apache.beam.sdk.transforms.FlatMapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptor;
import org.apache.beam.sdk.values.TypeDescriptors;

import java.util.stream.Collectors;

public class WatchToCourseTransform extends
        PTransform<PCollection<KV<String, Watch>>, PCollection<KV<String, Course>>> {
    @Override
    public PCollection<KV<String, Course>> expand(PCollection<KV<String, Watch>> input) {
        return input.apply(FlatMapElements
                .into(TypeDescriptors.kvs(TypeDescriptors.strings(), TypeDescriptor.of(Course.class))).via(
                        e ->
                                CourseSearch.getCoursesFromWatch(e.getValue()).entrySet().stream()
                                        .map(a -> KV.of(a.getKey(), a.getValue())).collect(Collectors.toList())
                ));
    }
}
