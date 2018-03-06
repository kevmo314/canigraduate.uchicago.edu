package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.collegecatalog.CollegeCatalog;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.models.Key;
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

public class CatalogCoursesTransform extends PTransform<PBegin, PCollection<KV<String, Course>>> {
    @Override
    public PCollection<KV<String, Course>> expand(PBegin input) {
        return input.getPipeline().apply(new DepartmentTransform()).apply(new CourseTransform());
    }

    static class DepartmentTransform extends PTransform<PBegin, PCollection<KV<Key, String>>> {
        @Override
        public PCollection<KV<Key, String>> expand(PBegin input) {
            try {
                return input.getPipeline()
                        .apply(Create.of(CollegeCatalog.getDepartments()))
                        .apply(MapElements.into(new TypeDescriptor<KV<Key, String>>() {
                        }).via(e -> KV.of(Key.builder().setDepartment(e.getKey()).build(), e.getValue())));
            } catch (IOException ex) {
                throw new RuntimeException(ex);
            }
        }
    }

    static class CourseTransform extends PTransform<PCollection<KV<Key, String>>, PCollection<KV<String, Course>>> {
        @Override
        public PCollection<KV<String, Course>> expand(PCollection<KV<Key, String>> input) {
            return input.apply(FlatMapElements.into(new TypeDescriptor<KV<String, Course>>() {
            }).via(e -> {
                try {
                    return CollegeCatalog.getCoursesAndSequences(e.getValue())
                            .entrySet()
                            .stream().map(entry -> KV.of(entry.getKey(), entry.getValue()))
                            .collect(Collectors.toList());
                } catch (IOException ex) {
                    throw new RuntimeException(ex);
                }
            }));
        }
    }
}
