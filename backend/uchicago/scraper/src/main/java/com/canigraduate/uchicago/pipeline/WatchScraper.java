package com.canigraduate.uchicago.pipeline;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.pipeline.models.TermKey;
import com.canigraduate.uchicago.pipeline.transforms.FirestoreListWatchesTransform;
import com.canigraduate.uchicago.pipeline.transforms.UploadTransform;
import com.canigraduate.uchicago.pipeline.transforms.WatchToCourseTransform;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PBegin;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PDone;

public class WatchScraper extends PTransform<PBegin, PDone> {
    public static void main(String[] args) {
        Pipeline p = DataflowPipeline.create("uchicago-watchscraper");
        p.apply(new WatchScraper());
        p.run().waitUntilFinish();
    }

    @Override
    public PDone expand(PBegin input) {
        Pipeline p = input.getPipeline();

        PCollection<KV<TermKey, Course>> watch = p.apply(new FirestoreListWatchesTransform())
                .apply(new WatchToCourseTransform());
        watch.apply(new UploadTransform());

        return PDone.in(p);
    }

}
