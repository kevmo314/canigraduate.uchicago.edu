package com.canigraduate.uchicago.pipeline.indexing;

import com.canigraduate.uchicago.firestore.FirestoreService;
import com.canigraduate.uchicago.models.Section;
import com.canigraduate.uchicago.pipeline.ReduceElements;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.google.gson.JsonObject;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.GroupByKey;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PDone;
import org.apache.beam.sdk.values.TypeDescriptors;

import java.util.Objects;

public class InstructorsIndexer {
    public static PTransform<PCollection<KV<Key, Section>>, PDone> of(String field) {
        return new PTransform<PCollection<KV<Key, Section>>, PDone>() {
            @Override
            public PDone expand(PCollection<KV<Key, Section>> input) {
                input.apply("Extract instructors", ParDo.of(new DoFn<KV<Key, Section>, KV<String, String>>() {
                    @ProcessElement
                    public void processElement(ProcessContext c) {
                        String course = Objects.requireNonNull(c.element().getKey()).getCourse();
                        c.element()
                                .getValue()
                                .getPrimaryActivities()
                                .stream()
                                .flatMap(activity -> activity.getInstructors().stream())
                                .forEach(instructor -> c.output(KV.of(instructor, course)));
                        c.element()
                                .getValue()
                                .getSecondaryActivities()
                                .stream()
                                .flatMap(activity -> activity.getInstructors().stream())
                                .forEach(instructor -> c.output(KV.of(instructor, course)));
                    }
                }))
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
