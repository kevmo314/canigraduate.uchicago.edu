package com.canigraduate.uchicago.pipeline.indexing;

import com.canigraduate.uchicago.firestore.FirestoreService;
import com.canigraduate.uchicago.pipeline.ReduceElements;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.google.gson.JsonObject;
import org.apache.beam.sdk.transforms.GroupByKey;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.SerializableFunction;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PDone;
import org.apache.beam.sdk.values.TypeDescriptors;

import java.util.Objects;

public class KeyIndexer {
    public static PTransform<PCollection<Key>, PDone> of(String field, SerializableFunction<Key, String> fn) {
        return new PTransform<PCollection<Key>, PDone>() {
            @Override
            public PDone expand(PCollection<Key> input) {
                input.apply(MapElements.into(TypeDescriptors.kvs(TypeDescriptors.strings(), TypeDescriptors.strings()))
                        .via(key -> KV.of(fn.apply(key), key.getCourse())))
                        .apply(GroupByKey.create())
                        .apply(new MapToJsonArray())
                        .apply(ReduceElements.into(TypeDescriptors.voids()).via(e -> {
                            JsonObject index = new JsonObject();
                            e.forEach(kv -> index.add(Objects.requireNonNull(kv.getKey()), kv.getValue()));
                            FirestoreService.writeIndex(field, index.toString());
                            return null;
                        }));
                return PDone.in(input.getPipeline());
            }
        };
    }
}