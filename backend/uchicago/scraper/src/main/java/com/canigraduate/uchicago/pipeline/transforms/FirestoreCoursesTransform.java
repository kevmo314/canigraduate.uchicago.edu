package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.firestore.Courses;
import com.canigraduate.uchicago.firestore.Terms;
import com.canigraduate.uchicago.models.Term;
import com.canigraduate.uchicago.pipeline.models.Key;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.FlatMapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.PBegin;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptor;

import java.util.stream.Collectors;

public class FirestoreCoursesTransform extends PTransform<PBegin, PCollection<Key>> {
    @Override
    public PCollection<Key> expand(PBegin input) {
        return input.getPipeline()
                .apply(Create.of(new Courses().list()).withType(TypeDescriptor.of(String.class)))
                .apply(FlatMapElements.into(TypeDescriptor.of(Key.class)).via(course -> new Terms(course).list()
                                .stream()
                                .map(Term::create)
                        .map(term -> Key.builder()
                                .setCourse(course)
                                .setDepartment(course.substring(0, 4))
                                .setTerm(term)
                                .build())
                        .collect(Collectors.toList())));
    }
}
