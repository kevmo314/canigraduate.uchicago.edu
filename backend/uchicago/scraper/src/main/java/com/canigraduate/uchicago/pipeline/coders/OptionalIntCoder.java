package com.canigraduate.uchicago.pipeline.coders;

import com.google.common.collect.ImmutableList;
import org.apache.beam.sdk.coders.AtomicCoder;
import org.apache.beam.sdk.coders.Coder;
import org.apache.beam.sdk.coders.CoderException;
import org.apache.beam.sdk.coders.NullableCoder;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;
import java.util.OptionalInt;

public class OptionalIntCoder extends Coder<OptionalInt> {
    private final NullableCoder<Integer> nullableCoder;

    private OptionalIntCoder(AtomicCoder<Integer> intCoder) {
        this.nullableCoder = NullableCoder.of(intCoder);
    }

    public static OptionalIntCoder of(AtomicCoder<Integer> intCoder) {
        return new OptionalIntCoder(intCoder);
    }

    @Override
    public void encode(OptionalInt value, OutputStream outStream) throws CoderException, IOException {
        this.nullableCoder.encode(value.isPresent() ? value.getAsInt() : null, outStream);
    }

    @Override
    public OptionalInt decode(InputStream inStream) throws CoderException, IOException {
        Integer value = this.nullableCoder.decode(inStream);
        return value == null ? OptionalInt.empty() : OptionalInt.of(value);
    }

    @Override
    public List<? extends Coder<?>> getCoderArguments() {
        return ImmutableList.of(this.nullableCoder);
    }

    @Override
    public void verifyDeterministic() throws NonDeterministicException {
        verifyDeterministic(this, "Value coder must be deterministic", this.nullableCoder);
    }
}
