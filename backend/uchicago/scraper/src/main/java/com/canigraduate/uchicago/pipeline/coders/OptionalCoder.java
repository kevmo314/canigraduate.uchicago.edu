package com.canigraduate.uchicago.pipeline.coders;

import com.google.common.collect.ImmutableList;
import org.apache.beam.sdk.coders.Coder;
import org.apache.beam.sdk.coders.CoderException;
import org.apache.beam.sdk.coders.NullableCoder;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;
import java.util.Optional;

public class OptionalCoder<T> extends Coder<Optional<T>> {
    private final NullableCoder<T> nullableCoder;

    private OptionalCoder(Coder<T> valueCoder) {
        this.nullableCoder = NullableCoder.of(valueCoder);
    }

    public static <T> OptionalCoder<T> of(Coder<T> valueCoder) {
        if (valueCoder instanceof OptionalCoder) {
            return (OptionalCoder<T>) valueCoder;
        }
        return new OptionalCoder<>(valueCoder);
    }

    @Override
    public void encode(Optional<T> value, OutputStream outStream) throws CoderException, IOException {
        this.nullableCoder.encode(value.orElse(null), outStream);
    }

    @Override
    public Optional<T> decode(InputStream inStream) throws CoderException, IOException {
        return Optional.ofNullable(this.nullableCoder.decode(inStream));
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
