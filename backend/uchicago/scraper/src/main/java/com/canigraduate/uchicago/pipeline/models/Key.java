package com.canigraduate.uchicago.pipeline.models;

import com.canigraduate.uchicago.models.Term;
import com.google.auto.value.AutoValue;

@AutoValue
public abstract class Key {
    public static Builder builder() {
        return new AutoValue_Key.Builder();
    }

    public abstract Term getTerm();

    public abstract String getDepartment();

    public abstract String getCourse();

    @AutoValue.Builder
    public abstract static class Builder {
        public abstract Builder setTerm(Term term);

        public abstract Builder setDepartment(String department);

        public abstract Builder setCourse(String course);

        public abstract Key build();
    }
}