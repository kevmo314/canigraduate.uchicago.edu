package com.canigraduate.uchicago.pipeline.coders;

import com.google.gson.JsonArray;
import com.google.gson.JsonParser;
import org.apache.beam.sdk.coders.Coder;
import org.apache.beam.sdk.coders.CustomCoder;
import org.apache.beam.sdk.coders.StringUtf8Coder;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class JsonArrayCoder extends CustomCoder<JsonArray> {
    private static final Coder<String> STRING_UTF_8_CODER = StringUtf8Coder.of();
    private static final JsonParser PARSER = new JsonParser();

    public static JsonArrayCoder of() {
        return new JsonArrayCoder();
    }

    @Override
    public void encode(JsonArray value, OutputStream outStream) throws IOException {
        STRING_UTF_8_CODER.encode(value.toString(), outStream);
    }

    @Override
    public JsonArray decode(InputStream inStream) throws IOException {
        return PARSER.parse(STRING_UTF_8_CODER.decode(inStream)).getAsJsonArray();
    }

    @Override
    public void verifyDeterministic() throws NonDeterministicException {
        verifyDeterministic(this, "Value coder must be deterministic", STRING_UTF_8_CODER);
    }
}
