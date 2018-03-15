package com.canigraduate.uchicago.pipeline.firestore;

import com.canigraduate.uchicago.firestore.Sections;
import com.canigraduate.uchicago.models.Section;
import com.canigraduate.uchicago.pipeline.models.Key;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;

import java.util.Objects;

public class FirestoreGetSectionsDoFn extends DoFn<KV<Key, Iterable<String>>, KV<Key, Section>> {
    @ProcessElement
    public void processElement(ProcessContext c) {
        Key key = Objects.requireNonNull(c.element().getKey());
        c.element()
                .getValue()
                .forEach(sectionId -> new Sections(key.getCourse(), key.getTerm().getTerm()).get(sectionId)
                        .map(section -> KV.of(key, section))
                        .ifPresent(c::output));
    }
}
