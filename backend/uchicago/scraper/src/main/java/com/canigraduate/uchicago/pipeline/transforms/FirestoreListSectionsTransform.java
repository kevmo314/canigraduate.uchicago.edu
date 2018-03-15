package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.firestore.Sections;
import com.canigraduate.uchicago.pipeline.models.Key;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptor;

public class FirestoreListSectionsTransform
        extends PTransform<PCollection<Key>, PCollection<KV<Key, Iterable<String>>>> {
    private static final TypeDescriptor<KV<Key, Iterable<String>>> OUTPUT = new TypeDescriptor<KV<Key, Iterable<String>>>() {
    };

    @Override
    public PCollection<KV<Key, Iterable<String>>> expand(PCollection<Key> input) {
        return input.apply(MapElements.into(OUTPUT)
                .via(key -> KV.of(key, new Sections(key.getCourse(), key.getTerm().getTerm()).list())));
    }
}
