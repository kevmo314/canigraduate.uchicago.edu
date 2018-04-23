package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.firestore.Courses;
import com.canigraduate.uchicago.models.Course;
import com.google.common.collect.Streams;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.FlatMapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.*;

import java.util.stream.Collectors;

public class FirestoreListCoursesTransform extends PTransform<PBegin, PCollection<KV<String, Course>>> {
    @Override
    public PCollection<KV<String, Course>> expand(PBegin input) {
        return input.getPipeline().apply(Create.of(1).withType(TypeDescriptors.integers()))
                // Done to avoid running new Courses().list() locally to reduce egress charges/latency.
                .apply("Fetch courses", FlatMapElements.into(
                        TypeDescriptors.kvs(TypeDescriptors.strings(), TypeDescriptor.of(Course.class)))
                        .via(ignore -> Streams.stream(new Courses().all())
                                .map(entry -> KV.of(entry.getKey(), entry.getValue()))
                                .collect(Collectors.toList())));
    }
}
