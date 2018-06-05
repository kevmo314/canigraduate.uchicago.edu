package com.canigraduate.uchicago.models;

import com.google.auto.value.AutoValue;

@AutoValue
public abstract class Watch {
    public static Builder builder() {
        return new AutoValue_Watch.Builder();
    }

    public abstract String getCourse();

    public abstract String getSection();

    public abstract String getTerm();

    @AutoValue.Builder
    public abstract static class Builder {

        public abstract Builder setCourse(String course);

        public abstract Builder setSection(String section);

        public abstract Builder setTerm(String term);

        public abstract Watch build();
    }
}
