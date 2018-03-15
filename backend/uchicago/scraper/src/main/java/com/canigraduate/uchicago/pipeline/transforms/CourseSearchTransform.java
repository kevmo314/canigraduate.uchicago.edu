package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.coursesearch.CourseSearch;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.canigraduate.uchicago.pipeline.models.TermAndDepartment;
import com.google.auto.value.AutoValue;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.FlatMapElements;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.*;

import java.io.IOException;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

public class CourseSearchTransform extends PTransform<PBegin, PCollection<KV<Key, Course>>> {
    private static final TypeDescriptor<Key> KEY = TypeDescriptor.of(Key.class);
    private static final TypeDescriptor<Course> COURSE = TypeDescriptor.of(Course.class);
    private static final TypeDescriptor<TermAndDepartment> TERM_AND_DEPARTMENT = TypeDescriptor.of(
            TermAndDepartment.class);
    private static final TypeDescriptor<Params> PARAMS = TypeDescriptor.of(Params.class);

    @Override
    public PCollection<KV<Key, Course>> expand(PBegin input) {
        try {
            return input.getPipeline()
                    .apply("Get terms", Create.of(CourseSearch.getTerms()))
                    .apply("Get departments",
                            FlatMapElements.into(TypeDescriptors.kvs(TERM_AND_DEPARTMENT, PARAMS)).via(e -> {
                                try {
                                    return CourseSearch.getDepartments(e.getValue())
                                            .entrySet()
                                            .stream()
                                            .map(entry -> KV.of(TermAndDepartment.create(e.getKey(), entry.getKey()),
                                                    Params.create(e.getValue(), entry.getValue())))
                                            .collect(Collectors.toList());
                                } catch (IOException ex) {
                                    throw new RuntimeException(ex);
                                }
                            }))
                    .apply("Fetch departments",
                            FlatMapElements.into(TypeDescriptors.kvs(TERM_AND_DEPARTMENT, TypeDescriptors.strings()))
                                    .via(e -> CourseSearch.getCoursePages(e.getValue().getTermKey(),
                                            e.getValue().getDepartmentKey())
                                            .stream()
                                            .map(entry -> KV.of(e.getKey(), entry))
                                            .collect(Collectors.toList())))
                    .apply("Get courses", MapElements.into(TypeDescriptors.kvs(KEY, COURSE)).via(e -> {
                        Map.Entry<String, Course> entry = CourseSearch.getCourseEntry(e.getValue());
                        TermAndDepartment key = Objects.requireNonNull(e.getKey());
                        return KV.of(Key.builder()
                                .setTerm(key.getTerm())
                                .setDepartment(key.getDepartment())
                                .setCourse(entry.getKey())
                                .build(), entry.getValue());
                    }));
        } catch (IOException ex) {
            throw new RuntimeException(ex);
        }
    }

    @AutoValue
    public abstract static class Params {
        public static Params create(String newTermKey, String newDepartmentKey) {
            return new AutoValue_CourseSearchTransform_Params(newTermKey, newDepartmentKey);
        }

        public abstract String getTermKey();

        public abstract String getDepartmentKey();

    }
}
