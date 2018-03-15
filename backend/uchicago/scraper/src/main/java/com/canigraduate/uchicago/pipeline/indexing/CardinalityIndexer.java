package com.canigraduate.uchicago.pipeline.indexing;

import com.canigraduate.uchicago.pipeline.ReduceElements;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Iterables;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.*;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

public class CardinalityIndexer extends PTransform<PCollection<KV<Key, Iterable<String>>>, PCollection<JsonObject>> {
    private final PCollectionView<List<String>> terms;
    private final PCollectionView<List<String>> courses;

    CardinalityIndexer(PCollectionView<List<String>> courses, PCollectionView<List<String>> terms) {
        this.courses = courses;
        this.terms = terms;
    }

    public static PTransform<PCollection<KV<Key, Iterable<String>>>, PCollection<JsonObject>> of(
            PCollectionView<List<String>> courses, PCollectionView<List<String>> terms) {
        return new CardinalityIndexer(courses, terms);
    }

    @Override
    public PCollection<JsonObject> expand(PCollection<KV<Key, Iterable<String>>> input) {
        return input.apply(
                MapElements.into(TypeDescriptors.kvs(TypeDescriptor.of(Key.class), TypeDescriptors.integers()))
                        .via(e -> KV.of(e.getKey(), Iterables.size(e.getValue()))))
                .apply(new ReduceElements<>())
                .apply(ParDo.of(new DoFn<Iterable<KV<Key, Integer>>, List<Integer>>() {
                    @ProcessElement
                    public void processElement(ProcessContext c) {
                        List<String> courseSet = c.sideInput(courses);
                        List<String> termSet = c.sideInput(terms);
                        ImmutableList.Builder<Integer> builder = new ImmutableList.Builder<>();
                        c.element().forEach(kv -> {
                            Key key = Objects.requireNonNull(kv.getKey());
                            builder.add(Preconditions.checkPositionIndex(
                                    Collections.binarySearch(courseSet, key.getCourse()), courseSet.size()));
                            builder.add(Preconditions.checkPositionIndex(
                                    Collections.binarySearch(termSet, key.getTerm().getTerm()), termSet.size()));
                            builder.add(kv.getValue());
                        });
                        c.output(builder.build());
                    }
                }).withSideInputs(courses, terms))
                .apply(new PackIntegerArray())
                .apply(ParDo.of(new DoFn<String, JsonObject>() {
                    @ProcessElement
                    public void processElement(ProcessContext c) {
                        JsonObject output = new JsonObject();
                        output.addProperty("cardinality", c.element());
                        JsonArray coursesArray = new JsonArray();
                        c.sideInput(courses).forEach(coursesArray::add);
                        output.add("courses", coursesArray);
                        JsonArray termsArray = new JsonArray();
                        c.sideInput(terms).forEach(termsArray::add);
                        output.add("terms", termsArray);
                        c.output(output);
                    }
                }).withSideInputs(courses, terms));
    }
}
