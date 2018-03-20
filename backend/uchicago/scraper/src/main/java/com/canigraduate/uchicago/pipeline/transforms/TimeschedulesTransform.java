package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.models.TermAndDepartment;
import com.canigraduate.uchicago.pipeline.models.TermKey;
import com.canigraduate.uchicago.timeschedules.Timeschedules;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.FlatMapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PBegin;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptor;

import java.io.IOException;
import java.util.Objects;
import java.util.stream.Collectors;

public class TimeschedulesTransform extends PTransform<PBegin, PCollection<KV<TermKey, Course>>> {
    @Override
    public PCollection<KV<TermKey, Course>> expand(PBegin input) {
        try {
            return input.getPipeline()
                    .apply("Get terms", Create.of(Timeschedules.getTerms()))
                    .apply("Get departments", FlatMapElements.into(new TypeDescriptor<KV<TermAndDepartment, String>>() {
                    }).via(e -> {
                        try {
                            return Timeschedules.getDepartments(e.getValue())
                                    .entrySet()
                                    .stream()
                                    .map(entry -> KV.of(TermAndDepartment.create(e.getKey(), entry.getKey()),
                                            entry.getValue()))
                                    .collect(Collectors.toList());
                        } catch (IOException ex) {
                            throw new RuntimeException(ex);
                        }
                    })).apply("Get courses", FlatMapElements.into(new TypeDescriptor<KV<TermKey, Course>>() {
                    }).via(e -> {
                        try {
                            return Timeschedules.getCourses(e.getValue()).entrySet().stream().map(entry -> {
                                TermAndDepartment key = Objects.requireNonNull(e.getKey());
                                return KV.of(TermKey.builder().setTerm(key.getTerm()).setCourse(entry.getKey()).build(),
                                        entry.getValue());
                            }).collect(Collectors.toList());
                        } catch (IOException ex) {
                            throw new RuntimeException(ex);
                        }
                    }));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
