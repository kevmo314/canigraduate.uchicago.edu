package com.canigraduate.uchicago.pipeline.transforms;

import org.apache.beam.sdk.transforms.Count;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.transforms.join.CoGbkResult;
import org.apache.beam.sdk.transforms.join.CoGroupByKey;
import org.apache.beam.sdk.transforms.join.KeyedPCollectionTuple;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionList;
import org.apache.beam.sdk.values.TupleTag;

public class DifferenceTransform<T> extends PTransform<PCollectionList<T>, PCollection<T>> {
    @Override
    public PCollection<T> expand(PCollectionList<T> input) {
        PCollection<T> minuend = input.get(0);
        PCollection<T> subtrahend = input.get(1);
        final TupleTag<Long> minuendTag = new TupleTag<>();
        final TupleTag<Long> subtrahendTag = new TupleTag<>();
        return KeyedPCollectionTuple.of(minuendTag, minuend.apply("Minuend Count", Count.perElement()))
                .and(subtrahendTag, subtrahend.apply("Subtrahend Count", Count.perElement()))
                .apply("CoGroupByKey", CoGroupByKey.create())
                .apply("Subtract", ParDo.of(new DoFn<KV<T, CoGbkResult>, T>() {
                    @DoFn.ProcessElement
                    public void processElement(ProcessContext c) {
                        CoGbkResult result = c.element().getValue();
                        if (result.getOnly(minuendTag, 0L) > 0 && result.getOnly(subtrahendTag, 0L) == 0) {
                            c.output(c.element().getKey());
                        }
                    }
                }));
    }
}
