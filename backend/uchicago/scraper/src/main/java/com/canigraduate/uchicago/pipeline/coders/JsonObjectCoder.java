package com.canigraduate.uchicago.pipeline.coders;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.apache.beam.sdk.coders.Coder;
import org.apache.beam.sdk.coders.CustomCoder;
import org.apache.beam.sdk.coders.StringUtf8Coder;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class JsonObjectCoder extends CustomCoder<JsonObject> {
    private static final Coder<String> STRING_UTF_8_CODER = StringUtf8Coder.of();
    private static final JsonParser PARSER = new JsonParser();

    public static JsonObjectCoder of() {
        return new JsonObjectCoder();
    }

    @Override
    public void encode(JsonObject value, OutputStream outStream) throws IOException {
        STRING_UTF_8_CODER.encode(value.toString(), outStream);
    }

    @Override
    public JsonObject decode(InputStream inStream) throws IOException {
        return PARSER.parse(STRING_UTF_8_CODER.decode(inStream)).getAsJsonObject();
    }

    @Override
    public void verifyDeterministic() throws NonDeterministicException {
        verifyDeterministic(this, "Value coder must be deterministic", STRING_UTF_8_CODER);
    }
}
