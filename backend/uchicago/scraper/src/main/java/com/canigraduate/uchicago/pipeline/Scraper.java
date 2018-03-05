package com.canigraduate.uchicago.pipeline;

import com.canigraduate.uchicago.ServiceAccountCredentials;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.firestore.DeleteDoFn;
import com.canigraduate.uchicago.pipeline.firestore.UploadDoFn;
import com.canigraduate.uchicago.pipeline.firestore.UploadSequenceDoFn;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.canigraduate.uchicago.pipeline.transforms.*;
import com.google.common.collect.ImmutableList;
import org.apache.beam.runners.dataflow.DataflowRunner;
import org.apache.beam.runners.dataflow.options.DataflowPipelineOptions;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.transforms.Filter;
import org.apache.beam.sdk.transforms.Flatten;
import org.apache.beam.sdk.transforms.Keys;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionList;

import java.util.logging.Logger;

public class Scraper {
    private static final Logger LOGGER = Logger.getLogger(Scraper.class.getName());

    public static void main(String[] args) {
        DataflowPipelineOptions dataflowOptions = PipelineOptionsFactory.create().as(DataflowPipelineOptions.class);
        dataflowOptions.setRunner(DataflowRunner.class);
        dataflowOptions.setJobName("scraper-uchicago");
        dataflowOptions.setProject("canigraduate-43286");
        dataflowOptions.setTempLocation("gs://uchicago/dataflow-temp");
        dataflowOptions.setGcpCredential(ServiceAccountCredentials.getCredentials(
                ImmutableList.of("https://www.googleapis.com/auth/cloud-platform")));

        Pipeline p = Pipeline.create(dataflowOptions);
        p.getCoderRegistry().registerCoderProvider(new ModelSubtypeCoderProvider());

        PCollection<KV<Key, Course>> courses = PCollectionList.of(p.apply(new TimeschedulesTransform()))
                .and(p.apply(new CourseSearchTransform()))
                .apply(Flatten.pCollections())
                .apply("Assign priorities", ParDo.of(new AssignPriorityDoFn()));
        courses.apply("Upload course data", ParDo.of(new UploadDoFn()));
        PCollection<Key> courseKeys = courses.apply("Fetch course keys", Keys.create());
        PCollectionList.of(p.apply(new FirestoreCoursesTransform()))
                .and(courseKeys)
                .apply("Find tombstone courses", new DifferenceTransform<>())
                .apply("Delete from Firestore", ParDo.of(new DeleteDoFn()));
        // Then pull the course search data
        PCollection<KV<Key, Course>> catalog = p.apply(new CatalogCoursesTransform());
        // Upload the courses.
        catalog.apply("Filter to courses", Filter.by(element -> element.getValue().isLeaf()))
                .apply("Upload course descriptions", ParDo.of(new UploadDoFn()));
        catalog.apply("Filter to sequences", Filter.by(element -> !element.getValue().isLeaf()))
                .apply("Upload sequences", ParDo.of(new UploadSequenceDoFn()));
        // And subtract the observed courses from the course search keys
        PCollectionList.of(courseKeys)
                .and(catalog.apply("Fetch description keys", Keys.create()))
                .apply("Find unresolved courses", new DifferenceTransform<>())
                .apply("Fetch from Ribbit", ParDo.of(new RibbitDoFn()))
                .apply("Upload Ribbit data", ParDo.of(new UploadDoFn()));
        p.run().waitUntilFinish();
    }
}
