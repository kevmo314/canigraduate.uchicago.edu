package com.canigraduate.uchicago.pipeline.indexing;

import com.google.common.collect.ImmutableSortedSet;
import com.google.gson.JsonArray;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptor;
import org.apache.beam.sdk.values.TypeDescriptors;

class MapValuesToJsonArray
        extends PTransform<PCollection<KV<String, Iterable<String>>>, PCollection<KV<String, JsonArray>>> {
    @Override
    public PCollection<KV<String, JsonArray>> expand(PCollection<KV<String, Iterable<String>>> input) {
        return input.apply(
                MapElements.into(TypeDescriptors.kvs(TypeDescriptors.strings(), TypeDescriptor.of(JsonArray.class)))
                        .via(e -> {
                            JsonArray value = new JsonArray();
                            ImmutableSortedSet.copyOf(e.getValue()).forEach(value::add);
                            return KV.of(e.getKey(), value);
                        }));
    }
}
