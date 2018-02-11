package com.canigraduate.uchicago.pipeline.coders;

import com.canigraduate.uchicago.pipeline.transforms.CourseSearchTransform;
import org.apache.beam.sdk.coders.Coder;
import org.apache.beam.sdk.coders.CoderException;
import org.apache.beam.sdk.coders.CustomCoder;
import org.apache.beam.sdk.coders.StringUtf8Coder;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class ParamsCoder extends CustomCoder<CourseSearchTransform.Params> {
    private static final Coder<String> STRING_CODER = StringUtf8Coder.of();

    public static ParamsCoder of() {
        return new ParamsCoder();
    }

    @Override
    public void encode(CourseSearchTransform.Params value, OutputStream outStream) throws CoderException, IOException {
        STRING_CODER.encode(value.getTermKey(), outStream);
        STRING_CODER.encode(value.getDepartmentKey(), outStream);
    }

    @Override
    public CourseSearchTransform.Params decode(InputStream inStream) throws CoderException, IOException {
        return CourseSearchTransform.Params.create(STRING_CODER.decode(inStream), STRING_CODER.decode(inStream));
    }
}