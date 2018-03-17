package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.firestore.Sections;
import com.canigraduate.uchicago.models.Section;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.google.common.collect.Iterables;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptor;

import java.util.Map;

public class FirestoreListSectionsTransform
        extends PTransform<PCollection<Key>, PCollection<KV<Key, Iterable<Section>>>> {
    private static final TypeDescriptor<KV<Key, Iterable<Section>>> OUTPUT = new TypeDescriptor<KV<Key, Iterable<Section>>>() {
    };

    @Override
    public PCollection<KV<Key, Iterable<Section>>> expand(PCollection<Key> input) {
        return input.apply(MapElements.into(OUTPUT)
                .via(key -> KV.of(key, Iterables.transform(new Sections(key.getCourse(), key.getTerm().getTerm()).all(),
                        Map.Entry::getValue))));
    }
}
