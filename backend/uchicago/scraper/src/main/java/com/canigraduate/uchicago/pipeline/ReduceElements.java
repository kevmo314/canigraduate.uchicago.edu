package com.canigraduate.uchicago.pipeline;

import org.apache.beam.sdk.coders.KvCoder;
import org.apache.beam.sdk.coders.VoidCoder;
import org.apache.beam.sdk.transforms.GroupByKey;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.Values;
import org.apache.beam.sdk.transforms.WithKeys;
import org.apache.beam.sdk.values.PCollection;

public class ReduceElements<T> extends PTransform<PCollection<T>, PCollection<Iterable<T>>> {
    @Override
    public PCollection<Iterable<T>> expand(PCollection<T> input) {
        return input.apply(WithKeys.of((Void) null))
                .setCoder(KvCoder.of(VoidCoder.of(), input.getCoder()))
                .apply(GroupByKey.create()).apply(Values.create());
    }
}
