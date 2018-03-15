package com.canigraduate.uchicago.pipeline;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.firestore.DeleteDoFn;
import com.canigraduate.uchicago.pipeline.firestore.SetSequenceDoFn;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.canigraduate.uchicago.pipeline.transforms.*;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.transforms.*;
import org.apache.beam.sdk.values.*;

public class Scraper extends PTransform<PBegin, PDone> {
    public static void main(String[] args) {
        Pipeline p = DataflowPipeline.create("uchicago-scraper");
        p.apply(new Scraper());
        p.run().waitUntilFinish();
    }

    @Override
    public PDone expand(PBegin input) {
        Pipeline p = input.getPipeline();

        PCollection<KV<Key, Course>> courses = PCollectionList.of(p.apply(new TimeschedulesTransform()))
                .and(p.apply(new CourseSearchTransform()))
                .apply(Flatten.pCollections());
        courses.apply("Assign priorities", new AssignPriorityTransform())
                .apply("Upload course data", new UploadTransform());
        PCollection<Key> courseKeys = courses.apply("Fetch course keys", Keys.create());
        PCollectionList.of(p.apply(new FirestoreCourseKeysTransform()))
                .and(courseKeys)
                .apply("Find tombstone courses", new DifferenceTransform<>())
                .apply("Delete from Firestore", ParDo.of(new DeleteDoFn()));
        // Then pull the course search data
        PCollection<KV<String, Course>> catalog = p.apply(new CatalogCoursesTransform());
        // Upload the courses.
        catalog.apply("Filter to courses", Filter.by(e -> e.getValue().isLeaf()))
                .apply("Upload course descriptions", new UploadDescriptionTransform());
        catalog.apply("Filter to sequences", Filter.by(e -> !e.getValue().isLeaf()))
                .apply("Upload sequences", ParDo.of(new SetSequenceDoFn()));
        // And subtract the observed courses from the course search keys
        PCollectionList.of(courseKeys.apply("Strip term and department",
                MapElements.into(TypeDescriptors.strings()).via(Key::getCourse)).apply("Distinct", new Distinct<>()))
                .and(catalog.apply("Fetch description keys", Keys.create()))
                .apply("Find unresolved courses", new DifferenceTransform<>())
                .apply("Fetch from Ribbit", ParDo.of(new RibbitDoFn()))
                .apply("Upload Ribbit data", new UploadDescriptionTransform());

        return PDone.in(p);
    }
}
