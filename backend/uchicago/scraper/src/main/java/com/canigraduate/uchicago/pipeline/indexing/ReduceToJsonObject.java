package com.canigraduate.uchicago.pipeline.indexing;

import com.canigraduate.uchicago.pipeline.ReduceElements;
import com.google.common.base.Preconditions;
import com.google.common.collect.Streams;
import com.google.gson.JsonObject;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionView;
import org.apache.beam.sdk.values.TypeDescriptor;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public class ReduceToJsonObject extends PTransform<PCollection<KV<String, Iterable<String>>>, PCollection<JsonObject>> {
    private final PCollectionView<List<String>> courses;

    private ReduceToJsonObject(PCollectionView<List<String>> courses) {
        this.courses = courses;
    }

    public static ReduceToJsonObject of(PCollectionView<List<String>> courses) {
        return new ReduceToJsonObject(courses);
    }

    @Override
    public PCollection<JsonObject> expand(PCollection<KV<String, Iterable<String>>> input) {
        return input.apply(ParDo.of(new DoFn<KV<String, Iterable<String>>, KV<String, String>>() {
            @ProcessElement
            public void processElement(ProcessContext c) {
                List<String> coursesArray = c.sideInput(courses);
                c.output(KV.of(c.element().getKey(), PackIntegerArray.pack(Streams.stream(c.element().getValue())
                        .distinct()
                        .map(course -> Preconditions.checkPositionIndex(Collections.binarySearch(coursesArray, course),
                                coursesArray.size()))
                        .collect(Collectors.toList()))));
            }
        }).withSideInputs(courses))
                .apply(new ReduceElements<>())
                .apply(MapElements.into(TypeDescriptor.of(JsonObject.class)).via(e -> {
                    JsonObject output = new JsonObject();
                    e.forEach(kv -> output.addProperty(Objects.requireNonNull(kv.getKey()), kv.getValue()));
                    return output;
                }));
    }
}
