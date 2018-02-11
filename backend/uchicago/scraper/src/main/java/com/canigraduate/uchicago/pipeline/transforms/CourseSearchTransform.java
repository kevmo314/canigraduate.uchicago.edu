package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.coursesearch.CourseSearch;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.google.auto.value.AutoValue;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.FlatMapElements;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PBegin;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptor;

import java.io.IOException;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class CourseSearchTransform extends PTransform<PBegin, PCollection<KV<Key, Course>>> {
    @Override
    public PCollection<KV<Key, Course>> expand(PBegin input) {
        return input.getPipeline()
                .apply(new TermTransform())
                .apply(new DepartmentTransform())
                .apply(new CourseTransform());
    }

    public static class TermTransform extends PTransform<PBegin, PCollection<KV<Key, String>>> {
        @Override
        public PCollection<KV<Key, String>> expand(PBegin input) {
            try {
                return input.getPipeline()
                        .apply(Create.of(CourseSearch.getTerms()))
                        .apply(MapElements.into(new TypeDescriptor<KV<Key, String>>() {
                        }).via(e -> KV.of(Key.builder().setTerm(e.getKey()).build(), e.getValue())));
            } catch (IOException ex) {
                throw new RuntimeException(ex);
            }
        }
    }

    public static class DepartmentTransform
            extends PTransform<PCollection<KV<Key, String>>, PCollection<KV<Key, Params>>> {
        @Override
        public PCollection<KV<Key, Params>> expand(PCollection<KV<Key, String>> input) {
            return input.apply(FlatMapElements.into(new TypeDescriptor<KV<Key, Params>>() {
            }).via(e -> {
                try {
                    return CourseSearch.getDepartments(e.getValue())
                            .entrySet()
                            .stream()
                            .map(entry -> KV.of(e.getKey().withDepartment(entry.getKey()),
                                    Params.create(e.getValue(), entry.getValue())))
                            .collect(Collectors.toList());
                } catch (IOException ex) {
                    throw new RuntimeException(ex);
                }
            }));
        }
    }

    public static class CourseTransform extends PTransform<PCollection<KV<Key, Params>>, PCollection<KV<Key, Course>>> {
        @Override
        public PCollection<KV<Key, Course>> expand(PCollection<KV<Key, Params>> input) {
            return input.apply(FlatMapElements.into(new TypeDescriptor<KV<Key, Course>>() {
            }).via(e -> {
                return IntStream.range(0, 25)
                        .boxed()
                        .flatMap(shard -> {
                            try {
                                return CourseSearch.getCourses(e.getValue().getTermKey(),
                                        e.getValue().getDepartmentKey(), shard).entrySet().stream();
                            } catch (IOException ex) {
                                throw new RuntimeException(ex);
                            }
                        })
                        .map(entry -> KV.of(e.getKey().withCourse(entry.getKey()), entry.getValue()))
                        .collect(Collectors.toList());
            }));
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
