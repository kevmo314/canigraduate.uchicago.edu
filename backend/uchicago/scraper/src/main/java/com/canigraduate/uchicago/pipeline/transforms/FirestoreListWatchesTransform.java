package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.firestore.Watches;
import com.canigraduate.uchicago.models.Watch;
import com.google.common.collect.Streams;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.FlatMapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.*;

import java.util.stream.Collectors;

public class FirestoreListWatchesTransform extends PTransform<PBegin, PCollection<KV<String, Watch>>> {
    @Override
    public PCollection<KV<String, Watch>> expand(PBegin input) {
        return input.getPipeline().apply(Create.of(1).withType(TypeDescriptors.integers()))
                // Done to avoid running new Courses().list() locally to reduce egress charges/latency.
                .apply("Fetch watches", FlatMapElements.into(
                        TypeDescriptors.kvs(TypeDescriptors.strings(), TypeDescriptor.of(Watch.class)))
                        .via(ignore -> Streams.stream(new Watches().all())
                                .map(entry -> KV.of(entry.getKey(), entry.getValue()))
                                .collect(Collectors.toList())));
    }
}
