package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.firestore.PatchCourseDoFn;
import com.google.common.collect.Streams;
import org.apache.beam.sdk.transforms.GroupByKey;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.*;

/**
 * Upload a course to Firestore.
 */
public class UploadDescriptionTransform extends PTransform<PCollection<KV<String, Course>>, PDone> {
    private static final TypeDescriptor<KV<String, Course>> INTERMEDIATE = TypeDescriptors.kvs(
            TypeDescriptors.strings(), TypeDescriptor.of(Course.class));

    @Override
    public PDone expand(PCollection<KV<String, Course>> input) {
        // Group by course first to reduce datastore contention.
        input.apply("Group by key", GroupByKey.create())
                .apply("Merge courses", MapElements.into(INTERMEDIATE)
                        .via(e -> KV.of(e.getKey(), Streams.stream(e.getValue()).reduce(null, Course::create))))
                .apply("Upload courses to Firestore", ParDo.of(new PatchCourseDoFn()));
        return PDone.in(input.getPipeline());
    }
}
