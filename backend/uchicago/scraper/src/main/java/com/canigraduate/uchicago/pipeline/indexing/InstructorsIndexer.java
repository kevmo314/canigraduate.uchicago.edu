package com.canigraduate.uchicago.pipeline.indexing;

import com.canigraduate.uchicago.models.Section;
import com.canigraduate.uchicago.pipeline.models.Key;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.GroupByKey;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;

import java.util.Objects;

public class InstructorsIndexer
        extends PTransform<PCollection<KV<Key, Iterable<Section>>>, PCollection<KV<String, Iterable<String>>>> {
    @Override
    public PCollection<KV<String, Iterable<String>>> expand(PCollection<KV<Key, Iterable<Section>>> input) {
        return input.apply("Extract instructors", ParDo.of(new DoFn<KV<Key, Iterable<Section>>, KV<String, String>>() {
            @ProcessElement
            public void processElement(ProcessContext c) {
                String course = Objects.requireNonNull(c.element().getKey()).getCourse();
                c.element().getValue().forEach(section -> {
                    section.getPrimaryActivities()
                            .stream()
                            .flatMap(activity -> activity.getInstructors().stream())
                            .forEach(instructor -> c.output(KV.of(instructor, course)));
                    section.getSecondaryActivities()
                            .stream()
                            .flatMap(activity -> activity.getInstructors().stream())
                            .forEach(instructor -> c.output(KV.of(instructor, course)));
                });
            }
        })).apply(GroupByKey.create());
    }
}
