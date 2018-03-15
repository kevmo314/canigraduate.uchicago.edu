package com.canigraduate.uchicago.pipeline;

import org.apache.beam.sdk.coders.KvCoder;
import org.apache.beam.sdk.coders.VoidCoder;
import org.apache.beam.sdk.transforms.*;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptor;

import javax.annotation.Nullable;
import java.util.Objects;

public class ReduceElements<InputT, OutputT> extends PTransform<PCollection<InputT>, PCollection<OutputT>> {
    private final TypeDescriptor<OutputT> outputType;
    private final SerializableFunction<Iterable<InputT>, OutputT> fn;

    private ReduceElements(@Nullable SerializableFunction<Iterable<InputT>, OutputT> fn,
                           @Nullable TypeDescriptor<OutputT> outputType) {
        this.fn = fn;
        this.outputType = outputType;
    }

    public static <OutputT> ReduceElements<?, OutputT> into(final TypeDescriptor<OutputT> outputType) {
        return new ReduceElements<>(null, outputType);
    }

    public <NewInputT> ReduceElements<NewInputT, OutputT> via(SerializableFunction<Iterable<NewInputT>, OutputT> fn) {
        return new ReduceElements<>(fn, outputType);
    }

    @Override
    public PCollection<OutputT> expand(PCollection<InputT> input) {
        return input.apply(WithKeys.of((Void) null))
                .setCoder(KvCoder.of(VoidCoder.of(), input.getCoder()))
                .apply(GroupByKey.create())
                .apply(Values.create())
                .apply(MapElements.into(outputType).via(Objects.requireNonNull(fn)));
    }
}
