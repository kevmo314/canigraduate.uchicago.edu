package com.canigraduate.uchicago.pipeline;

import com.canigraduate.uchicago.ServiceAccountCredentials;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.firestore.DeleteDoFn;
import com.canigraduate.uchicago.pipeline.firestore.UploadSequenceDoFn;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.canigraduate.uchicago.pipeline.transforms.*;
import com.google.common.collect.ImmutableList;
import org.apache.beam.runners.dataflow.DataflowRunner;
import org.apache.beam.runners.dataflow.options.DataflowPipelineOptions;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.transforms.*;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionList;
import org.apache.beam.sdk.values.TypeDescriptors;

import java.util.logging.Logger;

public class Scraper {
    private static final Logger LOGGER = Logger.getLogger(Scraper.class.getName());

    public static void main(String[] args) {
        DataflowPipelineOptions dataflowOptions = PipelineOptionsFactory.create().as(DataflowPipelineOptions.class);
        dataflowOptions.setRunner(DataflowRunner.class);
        dataflowOptions.setJobName("scraper-uchicago");
        dataflowOptions.setProject("canigraduate-43286");
        dataflowOptions.setTempLocation("gs://uchicago/dataflow-temp");
        dataflowOptions.setGcpCredential(new ServiceAccountCredentials(
                ImmutableList.of("https://www.googleapis.com/auth/cloud-platform")).getCredentials());

        Pipeline p = Pipeline.create(dataflowOptions);
        p.getCoderRegistry().registerCoderProvider(new ModelSubtypeCoderProvider());

        PCollection<KV<Key, Course>> courses = PCollectionList.of(p.apply(new TimeschedulesTransform()))
                .and(p.apply(new CourseSearchTransform())).apply(Flatten.pCollections());
        courses.apply("Assign priorities", ParDo.of(new AssignPriorityDoFn()))
                .apply("Upload course data", new UploadTransform());
        PCollection<Key> courseKeys = courses.apply("Fetch course keys", Keys.create());
        PCollectionList.of(p.apply(new FirestoreCoursesTransform()))
                .and(courseKeys)
                .apply("Find tombstone courses", new DifferenceTransform<>())
                .apply("Delete from Firestore", ParDo.of(new DeleteDoFn()));
        // Then pull the course search data
        PCollection<KV<String, Course>> catalog = p.apply(new CatalogCoursesTransform());
        // Upload the courses.
        PCollectionList<KV<String, Course>> partitions = catalog.apply("Partition to courses/sequences",
                Partition.of(2, (Partition.PartitionFn<KV<String, Course>>) (e, n) -> e.getValue().isLeaf() ? 1 : 0));
        partitions.get(1).apply("Upload course descriptions", new UploadDescriptionTransform());
        partitions.get(0).apply("Upload sequences", ParDo.of(new UploadSequenceDoFn()));
        // And subtract the observed courses from the course search keys
        PCollectionList.of(courseKeys.apply("Strip term and department",
                MapElements.into(TypeDescriptors.strings()).via(e -> e.getCourse().get()))
                .apply("Distinct", new Distinct<>()))
                .and(catalog.apply("Fetch description keys", Keys.create()))
                .apply("Find unresolved courses", new DifferenceTransform<>())
                .apply("Fetch from Ribbit", ParDo.of(new RibbitDoFn()))
                .apply("Upload Ribbit data", new UploadDescriptionTransform());
        p.run().waitUntilFinish();
    }
}
