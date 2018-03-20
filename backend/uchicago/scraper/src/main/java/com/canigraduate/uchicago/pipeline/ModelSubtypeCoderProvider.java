package com.canigraduate.uchicago.pipeline;

import com.canigraduate.uchicago.models.*;
import com.canigraduate.uchicago.pipeline.coders.*;
import com.canigraduate.uchicago.pipeline.models.TermAndDepartment;
import com.canigraduate.uchicago.pipeline.models.TermKey;
import com.canigraduate.uchicago.pipeline.transforms.CourseSearchTransform;
import com.google.common.collect.ImmutableMap;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.apache.beam.sdk.coders.CannotProvideCoderException;
import org.apache.beam.sdk.coders.Coder;
import org.apache.beam.sdk.coders.CoderProvider;
import org.apache.beam.sdk.values.TypeDescriptor;

import java.util.List;
import java.util.Map;

public class ModelSubtypeCoderProvider extends CoderProvider {
    private static final Map<Class<?>, Coder> CODER_MAP = new ImmutableMap.Builder<Class<?>, Coder>().put(TermKey.class,
            TermKeyCoder.of())
            .put(TermAndDepartment.class, TermAndDepartmentCoder.of())
            .put(JsonArray.class, JsonArrayCoder.of())
            .put(JsonObject.class, JsonObjectCoder.of())
            .put(CourseSearchTransform.Params.class, ParamsCoder.of())
            .put(Course.class, CourseCoder.of())
            .put(Enrollment.class, EnrollmentCoder.of())
            .put(PrimaryActivity.class, PrimaryActivityCoder.of())
            .put(SecondaryActivity.class, SecondaryActivityCoder.of())
            .put(Section.class, SectionCoder.of())
            .put(Term.class, TermCoder.of())
            .build();

    @Override
    public <T> Coder<T> coderFor(TypeDescriptor<T> typeDescriptor, List<? extends Coder<?>> componentCoders)
            throws CannotProvideCoderException {
        for (Map.Entry<Class<?>, Coder> entry : CODER_MAP.entrySet()) {
            if (typeDescriptor.isSubtypeOf(TypeDescriptor.of(entry.getKey()))) {
                return entry.getValue();
            }
        }
        throw new CannotProvideCoderException("Could not match coder.");
    }
}
