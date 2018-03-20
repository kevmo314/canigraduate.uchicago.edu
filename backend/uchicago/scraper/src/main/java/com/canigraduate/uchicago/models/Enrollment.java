package com.canigraduate.uchicago.models;

import com.google.auto.value.AutoValue;

import java.util.OptionalInt;

@AutoValue
public abstract class Enrollment {
    public static Builder builder() {
        return new AutoValue_Enrollment.Builder();
    }

    public abstract OptionalInt getEnrolled();

    public abstract OptionalInt getMaximum();

    public boolean isFull() {
        return getEnrolled().equals(getMaximum()) && getEnrolled().isPresent();
    }

    @AutoValue.Builder
    public abstract static class Builder {
        public abstract Builder setEnrolled(int enrolled);

        public abstract Builder setMaximum(int maximum);

        public abstract Builder setEnrolled(OptionalInt enrolled);

        public abstract Builder setMaximum(OptionalInt maximum);

        public abstract Enrollment build();
    }
}
