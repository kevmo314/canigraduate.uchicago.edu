package com.canigraduate.uchicago.pipeline.indexing;

import com.canigraduate.uchicago.firestore.FirestoreService;
import com.canigraduate.uchicago.pipeline.ReduceElements;
import com.canigraduate.uchicago.pipeline.firestore.CardinalityWriteReduceFn;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.google.common.collect.Iterables;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.*;

public class CardinalityIndexer {
    public static PTransform<PCollection<KV<Key, Iterable<String>>>, PDone> of(String field) {
        return new PTransform<PCollection<KV<Key, Iterable<String>>>, PDone>() {
            @Override
            public PDone expand(PCollection<KV<Key, Iterable<String>>> input) {
                input.apply(
                        MapElements.into(TypeDescriptors.kvs(TypeDescriptor.of(Key.class), TypeDescriptors.integers()))
                                .via(e -> KV.of(e.getKey(), Iterables.size(e.getValue()))))
                        .apply(ReduceElements.into(TypeDescriptors.strings()).via(new CardinalityWriteReduceFn()))
                        .apply(MapElements.into(TypeDescriptors.voids()).via(e -> {
                            FirestoreService.writeIndex(field, e);
                            return null;
                        }));
                return PDone.in(input.getPipeline());
            }
        };
    }
}
