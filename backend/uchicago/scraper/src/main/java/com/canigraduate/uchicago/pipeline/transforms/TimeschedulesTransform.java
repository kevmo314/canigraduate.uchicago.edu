package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.canigraduate.uchicago.timeschedules.Timeschedules;
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

public class TimeschedulesTransform extends PTransform<PBegin, PCollection<KV<Key, Course>>> {
    private static final TypeDescriptor<KV<Key, String>> INTERMEDIATE = new TypeDescriptor<KV<Key, String>>() {
    };
    private static final TypeDescriptor<KV<Key, Course>> OUTPUT = new TypeDescriptor<KV<Key, Course>>() {
    };

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
                        .apply(Create.of(Timeschedules.getTerms()))
                        .apply(MapElements.into(INTERMEDIATE)
                                .via(e -> KV.of(Key.builder().setTerm(e.getKey()).build(), e.getValue())));
            } catch (IOException ex) {
                throw new RuntimeException(ex);
            }
        }
    }

    public static class DepartmentTransform
            extends PTransform<PCollection<KV<Key, String>>, PCollection<KV<Key, String>>> {
        @Override
        public PCollection<KV<Key, String>> expand(PCollection<KV<Key, String>> input) {
            return input.apply(FlatMapElements.into(INTERMEDIATE).via(e -> {
                try {
                    return Timeschedules.getDepartments(e.getValue())
                            .entrySet()
                            .stream()
                            .map(entry -> KV.of(e.getKey().withDepartment(entry.getKey()), entry.getValue()))
                            .collect(Collectors.toList());
                } catch (IOException ex) {
                    throw new RuntimeException(ex);
                }
            }));
        }
    }

    public static class CourseTransform extends PTransform<PCollection<KV<Key, String>>, PCollection<KV<Key, Course>>> {
        @Override
        public PCollection<KV<Key, Course>> expand(PCollection<KV<Key, String>> input) {
            return input.apply(FlatMapElements.into(OUTPUT).via(e -> {
                try {
                    return Timeschedules.getCourses(e.getValue())
                            .entrySet()
                            .stream()
                            .map(entry -> KV.of(e.getKey().withCourse(entry.getKey()), entry.getValue()))
                            .collect(Collectors.toList());
                } catch (IOException ex) {
                    throw new RuntimeException(ex);
                }
            }));
        }
    }
}
