package com.canigraduate.uchicago.pipeline.coders;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.models.Section;
import org.apache.beam.sdk.coders.*;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public class CourseCoder extends CustomCoder<Course> {
    //allah
    private static final Coder<String> STRING_CODER = StringUtf8Coder.of();
    private static final Coder<Set<String>> STRING_SET_CODER = SetCoder.of(STRING_CODER);
    private static final Coder<Optional<String>> STRING_OPTIONAL_CODER = OptionalCoder.of(STRING_CODER);
    private static final Coder<Integer> INT_CODER = VarIntCoder.of();
    private static final Coder<Section> SECTION_CODER = SectionCoder.of();
    private static final Coder<Map<String, Section>> STRING_SECTION_MAP_CODER = MapCoder.of(STRING_CODER,
            SECTION_CODER);

    public static CourseCoder of() {
        return new CourseCoder();
    }

    @Override
    public void encode(Course value, OutputStream outStream) throws IOException {
        STRING_CODER.encode(value.getName(), outStream);
        STRING_OPTIONAL_CODER.encode(value.getDescription(), outStream);
        STRING_SET_CODER.encode(value.getNotes(), outStream);
        STRING_OPTIONAL_CODER.encode(value.getParent(), outStream);
        INT_CODER.encode(value.getPriority(), outStream);
        STRING_SECTION_MAP_CODER.encode(value.getSections(), outStream);
        STRING_SET_CODER.encode(value.getCrosslists(), outStream);
    }

    @Override
    public Course decode(InputStream inStream) throws IOException {
        return Course.builder()
                .setName(STRING_CODER.decode(inStream))
                .setDescription(STRING_OPTIONAL_CODER.decode(inStream))
                .addAllNotes(STRING_SET_CODER.decode(inStream))
                .setParent(STRING_OPTIONAL_CODER.decode(inStream))
                .setPriority(INT_CODER.decode(inStream))
                .putAllSections(STRING_SECTION_MAP_CODER.decode(inStream))
                .addAllCrosslists(STRING_SET_CODER.decode(inStream))
                .build();
    }

    @Override
    public void verifyDeterministic() throws NonDeterministicException {
        verifyDeterministic(this, "Value coder must be deterministic", STRING_CODER);
        verifyDeterministic(this, "Value coder must be deterministic", STRING_SET_CODER);
        verifyDeterministic(this, "Value coder must be deterministic", STRING_OPTIONAL_CODER);
        verifyDeterministic(this, "Value coder must be deterministic", INT_CODER);
        verifyDeterministic(this, "Value coder must be deterministic", SECTION_CODER);
        verifyDeterministic(this, "Value coder must be deterministic", STRING_SECTION_MAP_CODER);
    }
}