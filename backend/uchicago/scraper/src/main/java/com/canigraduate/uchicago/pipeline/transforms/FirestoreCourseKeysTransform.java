package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.firestore.Terms;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.models.Term;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.google.common.collect.Streams;
import org.apache.beam.sdk.transforms.FlatMapElements;
import org.apache.beam.sdk.transforms.Keys;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptor;

import java.util.stream.Collectors;

public class FirestoreCourseKeysTransform extends PTransform<PCollection<KV<String, Course>>, PCollection<Key>> {
    @Override
    public PCollection<Key> expand(PCollection<KV<String, Course>> input) {
        return input.apply(Keys.create())
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
