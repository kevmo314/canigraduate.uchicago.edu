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
        return this.getEnrolled().orElse(0) >= this.getMaximum().orElse(Integer.MAX_VALUE);
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
