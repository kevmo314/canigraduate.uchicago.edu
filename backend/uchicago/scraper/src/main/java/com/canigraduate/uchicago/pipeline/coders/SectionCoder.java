package com.canigraduate.uchicago.pipeline.coders;

import com.canigraduate.uchicago.models.Enrollment;
import com.canigraduate.uchicago.models.PrimaryActivity;
import com.canigraduate.uchicago.models.SecondaryActivity;
import com.canigraduate.uchicago.models.Section;
import org.apache.beam.sdk.coders.*;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Optional;
import java.util.Set;

public class SectionCoder extends CustomCoder<Section> {
    private static final Coder<String> STRING_CODER = StringUtf8Coder.of();
    private static final Coder<Set<String>> STRING_SET_CODER = SetCoder.of(STRING_CODER);
    private static final Coder<Optional<String>> STRING_OPTIONAL_CODER = OptionalCoder.of(STRING_CODER);
    private static final Coder<Enrollment> ENROLLMENT_CODER = EnrollmentCoder.of();
    private static final Coder<Set<PrimaryActivity>> PRIMARY_ACTIVITY_SET_CODER = SetCoder.of(
            PrimaryActivityCoder.of());
    private static final Coder<Set<SecondaryActivity>> SECONDARY_ACTIVITY_SET_CODER = SetCoder.of(
            SecondaryActivityCoder.of());

    public static SectionCoder of() {
        return new SectionCoder();
    }

    @Override
    public void encode(Section value, OutputStream outStream) throws IOException {
        STRING_SET_CODER.encode(value.getNotes(), outStream);
        STRING_OPTIONAL_CODER.encode(value.getPrerequisites(), outStream);
        ENROLLMENT_CODER.encode(value.getEnrollment(), outStream);
        PRIMARY_ACTIVITY_SET_CODER.encode(value.getPrimaryActivities(), outStream);
        SECONDARY_ACTIVITY_SET_CODER.encode(value.getSecondaryActivities(), outStream);
    }

    @Override
    public Section decode(InputStream inStream) throws CoderException, IOException {
        return Section.builder()
                .addAllNotes(STRING_SET_CODER.decode(inStream))
                .setPrerequisites(STRING_OPTIONAL_CODER.decode(inStream))
                .setEnrollment(ENROLLMENT_CODER.decode(inStream))
                .addAllPrimaryActivities(PRIMARY_ACTIVITY_SET_CODER.decode(inStream))
                .addAllSecondaryActivities(SECONDARY_ACTIVITY_SET_CODER.decode(inStream))
                .build();
    }
}