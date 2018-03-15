package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.firestore.Courses;
import com.canigraduate.uchicago.firestore.Terms;
import com.canigraduate.uchicago.models.Term;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.google.common.collect.Streams;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.FlatMapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.PBegin;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptor;
import org.apache.beam.sdk.values.TypeDescriptors;

import java.util.stream.Collectors;

public class FirestoreCourseKeysTransform extends PTransform<PBegin, PCollection<Key>> {
    @Override
    public PCollection<Key> expand(PBegin input) {
        return input.getPipeline()
                .apply(Create.of(1).withType(TypeDescriptors.integers()))
                // Done to avoid running new Courses().list() locally to reduce egress charges/latency.
                .apply("Fetch courses",
                        FlatMapElements.into(TypeDescriptors.strings()).via(ignore -> new Courses().list()))
                .apply("Fetch terms", FlatMapElements.into(TypeDescriptor.of(Key.class))
                        .via(course -> Streams.stream(new Terms(course).list())
                                .map(Term::create)
                                .map(term -> Key.builder()
                                        .setCourse(course)
                                        .setDepartment(course.substring(0, 4))
                                        .setTerm(term)
                                        .build())
                                .collect(Collectors.toList())));
    }
}
