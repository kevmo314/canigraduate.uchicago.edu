package com.canigraduate.uchicago.pipeline.indexing;

import com.canigraduate.uchicago.pipeline.models.Key;
import org.apache.beam.sdk.transforms.GroupByKey;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.SerializableFunction;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptors;

public class KeyIndexer extends PTransform<PCollection<Key>, PCollection<KV<String, Iterable<String>>>> {
    private final SerializableFunction<Key, String> fn;

    private KeyIndexer(SerializableFunction<Key, String> fn) {
        this.fn = fn;
    }

    public static PTransform<PCollection<Key>, PCollection<KV<String, Iterable<String>>>> of(
            SerializableFunction<Key, String> fn) {
        return new KeyIndexer(fn);
    }

    @Override
    public PCollection<KV<String, Iterable<String>>> expand(PCollection<Key> input) {
        return input.apply(MapElements.into(TypeDescriptors.kvs(TypeDescriptors.strings(), TypeDescriptors.strings()))
                .via(key -> KV.of(fn.apply(key), key.getCourse()))).apply(GroupByKey.create());
    }
}