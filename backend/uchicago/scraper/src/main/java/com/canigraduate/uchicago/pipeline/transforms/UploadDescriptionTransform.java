package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.firestore.UploadCourseDoFn;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.google.common.collect.Streams;
import org.apache.beam.sdk.transforms.GroupByKey;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PDone;
import org.apache.beam.sdk.values.TypeDescriptor;

/**
 * Upload a course to Firestore.
 */
public class UploadDescriptionTransform extends PTransform<PCollection<KV<String, Course>>, PDone> {
    private static final TypeDescriptor<KV<Key, Course>> INTERMEDIATE = new TypeDescriptor<KV<Key, Course>>() {
    };

    @Override
    public PDone expand(PCollection<KV<String, Course>> input) {
        // Group by course first to reduce datastore contention.
        input.apply("Map to Key", MapElements.into(INTERMEDIATE)
                .via(e -> KV.of(Key.builder().setCourse(e.getKey()).build(), e.getValue())))
                .apply("Group by key", GroupByKey.create())
                .apply("Merge courses", MapElements.into(INTERMEDIATE)
                        .via(e -> KV.of(e.getKey(), Streams.stream(e.getValue()).reduce(null, Course::create))))
                .apply("Upload courses to Firestore", ParDo.of(new UploadCourseDoFn()));
        return PDone.in(input.getPipeline());
    }
}
