package com.canigraduate.uchicago.pipeline.models;

import com.canigraduate.uchicago.models.Term;
import com.google.auto.value.AutoValue;

import java.util.Optional;

@AutoValue
public abstract class Key {
    public static Builder builder() {
        return new AutoValue_Key.Builder();
    }

    public abstract Builder toBuilder();

    public abstract Optional<Term> getTerm();

    public abstract Optional<String> getDepartment();

    public abstract Optional<String> getCourse();

    public Key withTerm(Term term) {
        return this.toBuilder().setTerm(term).build();
    }

    public Key withDepartment(String department) {
        return this.toBuilder().setDepartment(department).build();
    }

    public Key withCourse(String course) {
        return this.toBuilder().setCourse(course).build();
    }

    @AutoValue.Builder
    public abstract static class Builder {
        public abstract Builder setTerm(Term term);

        public abstract Builder setDepartment(String department);

        public abstract Builder setCourse(String course);

        public abstract Builder setTerm(Optional<Term> term);

        public abstract Builder setDepartment(Optional<String> department);

        public abstract Builder setCourse(Optional<String> course);

        public abstract Key build();
    }
}