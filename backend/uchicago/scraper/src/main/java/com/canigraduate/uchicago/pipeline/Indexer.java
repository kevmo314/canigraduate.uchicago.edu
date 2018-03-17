package com.canigraduate.uchicago.pipeline;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.models.Section;
import com.canigraduate.uchicago.pipeline.indexing.*;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.canigraduate.uchicago.pipeline.transforms.FirestoreCourseKeysTransform;
import com.canigraduate.uchicago.pipeline.transforms.FirestoreListCoursesTransform;
import com.canigraduate.uchicago.pipeline.transforms.FirestoreListSectionsTransform;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.transforms.Keys;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.*;

import java.util.List;

public class Indexer extends PTransform<PBegin, PDone> {

    public static void main(String[] args) {
        Pipeline p = DataflowPipeline.create("uchicago-indexer");
        p.apply(new Indexer());
        p.run().waitUntilFinish();
    }

    @Override
    public PDone expand(PBegin input) {
        Pipeline p = input.getPipeline();

        PCollection<KV<String, Course>> courses = p.apply("Get courses", new FirestoreListCoursesTransform());

        PCollection<Key> courseKeys = courses.apply("Get course keys", new FirestoreCourseKeysTransform());
        PCollection<KV<Key, Iterable<Section>>> sections = courseKeys.apply("Get sections",
                new FirestoreListSectionsTransform());
        PCollectionView<List<String>> courseIds = courses.apply(Keys.create()).apply(SortedView.of());
        PCollectionView<List<String>> termIds = courseKeys.apply("Get term",
                MapElements.into(TypeDescriptors.strings()).via(k -> k.getTerm().getTerm())).apply(SortedView.of());

        sections.apply("Build cardinality index", CardinalityIndexer.of(courseIds, termIds))
                .apply("Unpload cardinality table", UploadToStorageDoFn.of("cardinalities"));
        courseKeys.apply("Build department index", KeyIndexer.of(Key::getDepartment))
                .apply("Encode department index", ReduceToJsonObject.of(courseIds))
                .apply("Upload department index", UploadToStorageDoFn.of("departments"));
        courseKeys.apply("Build periods index", KeyIndexer.of(key -> key.getTerm().getPeriod()))
                .apply("Encode periods index", ReduceToJsonObject.of(courseIds))
                .apply("Upload periods index", UploadToStorageDoFn.of("periods"));
        courseKeys.apply("Build years index", KeyIndexer.of(key -> String.valueOf(key.getTerm().getYear())))
                .apply("Encode years index", ReduceToJsonObject.of(courseIds))
                .apply("Upload years index", UploadToStorageDoFn.of("years"));
        sections.apply("Build instructors index", new InstructorsIndexer())
                .apply("Encode instructors index", ReduceToJsonObject.of(courseIds))
                .apply("Upload instructors index", UploadToStorageDoFn.of("instructors"));

        return PDone.in(p);
    }
}
