package com.canigraduate.uchicago.pipeline;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.firestore.DeleteDoFn;
import com.canigraduate.uchicago.pipeline.firestore.UploadDoFn;
import com.canigraduate.uchicago.pipeline.firestore.UploadSequenceDoFn;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.canigraduate.uchicago.pipeline.transforms.*;
import org.apache.beam.runners.dataflow.DataflowRunner;
import org.apache.beam.runners.dataflow.options.DataflowPipelineOptions;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.transforms.*;
import org.apache.beam.sdk.transforms.join.CoGbkResult;
import org.apache.beam.sdk.transforms.join.CoGroupByKey;
import org.apache.beam.sdk.transforms.join.KeyedPCollectionTuple;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionList;
import org.apache.beam.sdk.values.TupleTag;

import java.util.logging.Logger;

public class Scraper {
    private static final Logger LOGGER = Logger.getLogger(Scraper.class.getName());

    public static <T> PCollection<T> subtract(PCollection<T> minuend, PCollection<T> subtrahend) {
        final TupleTag<Long> minuendTag = new TupleTag<>();
        final TupleTag<Long> subtrahendTag = new TupleTag<>();
        return KeyedPCollectionTuple.of(minuendTag, minuend.apply("Minuend Count", Count.perElement()))
                .and(subtrahendTag, subtrahend.apply("Subtrahend Count", Count.perElement()))
                .apply("CoGroupByKey", CoGroupByKey.create())
                .apply("Subtract", ParDo.of(new DoFn<KV<T, CoGbkResult>, T>() {
                    @ProcessElement
                    public void processElement(ProcessContext c) {
                        CoGbkResult result = c.element().getValue();
                        if (result.getOnly(minuendTag, 0L) > 0 && result.getOnly(subtrahendTag, 0L) == 0) {
                            c.output(c.element().getKey());
                        }
                    }
                }));
    }

    public static void main(String[] args) {
        DataflowPipelineOptions dataflowOptions = PipelineOptionsFactory.create().as(DataflowPipelineOptions.class);
        dataflowOptions.setRunner(DataflowRunner.class);
        dataflowOptions.setProject("canigraduate-43286");
        dataflowOptions.setTempLocation("gs://uchicago/dataflow-temp");

        Pipeline p = Pipeline.create(dataflowOptions);
        p.getCoderRegistry().registerCoderProvider(new ModelSubtypeCoderProvider());

        PCollection<KV<Key, Course>> courses = PCollectionList.of(p.apply(new TimeschedulesTransform()))
                .and(p.apply(new CourseSearchTransform()))
                .apply(Flatten.pCollections());
        courses.apply(ParDo.of(new UploadDoFn()));
        PCollection<Key> courseKeys = courses.apply(Keys.create());
        subtract(p.apply(new FirestoreCoursesTransform()), courseKeys).apply(ParDo.of(new DeleteDoFn()));
        // Then pull the course search data
        PCollection<KV<Key, Course>> catalog = p.apply(new CatalogCoursesTransform());
        // Upload the courses.
        catalog.apply(Filter.by(element -> element.getValue().isLeaf())).apply(ParDo.of(new UploadDoFn()));
        catalog.apply(Filter.by(element -> !element.getValue().isLeaf())).apply(ParDo.of(new UploadSequenceDoFn()));
        // And subtract the observed courses from the course search keys
        subtract(courseKeys, catalog.apply(Keys.create())).apply(ParDo.of(new RibbitDoFn()))
                .apply(ParDo.of(new UploadDoFn()));
        p.run().waitUntilFinish();
    }
}
