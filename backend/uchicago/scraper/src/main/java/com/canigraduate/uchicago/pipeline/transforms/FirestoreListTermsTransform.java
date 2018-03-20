package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.firestore.Terms;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.models.Term;
import com.canigraduate.uchicago.pipeline.models.TermKey;
import com.google.common.collect.Streams;
import org.apache.beam.sdk.transforms.FlatMapElements;
import org.apache.beam.sdk.transforms.Keys;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptor;

import java.util.stream.Collectors;

public class FirestoreListTermsTransform extends PTransform<PCollection<KV<String, Course>>, PCollection<TermKey>> {
    @Override
    public PCollection<TermKey> expand(PCollection<KV<String, Course>> input) {
        return input.apply(Keys.create()).apply("Fetch terms", FlatMapElements.into(TypeDescriptor.of(TermKey.class))
                        .via(course -> Streams.stream(new Terms(course).list())
                                .map(Term::create)
                                .map(term -> TermKey.builder().setCourse(course).setTerm(term).build())
                                .collect(Collectors.toList())));
    }
}
