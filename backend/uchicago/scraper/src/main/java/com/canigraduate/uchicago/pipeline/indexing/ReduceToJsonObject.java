package com.canigraduate.uchicago.pipeline.indexing;

import com.google.common.base.Preconditions;
import com.google.common.collect.Streams;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionView;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class ReduceToJsonObject
        extends PTransform<PCollection<KV<String, Iterable<String>>>, PCollection<KV<String, String>>> {
    private final PCollectionView<List<String>> courses;

    private ReduceToJsonObject(PCollectionView<List<String>> courses) {
        this.courses = courses;
    }

    public static ReduceToJsonObject of(PCollectionView<List<String>> courses) {
        return new ReduceToJsonObject(courses);
    }

    @Override
    public PCollection<KV<String, String>> expand(PCollection<KV<String, Iterable<String>>> input) {
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
        }).withSideInputs(courses));
    }
}
