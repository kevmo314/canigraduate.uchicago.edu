package com.canigraduate.uchicago.models;

import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableSet;

import java.util.Optional;

@AutoValue
public abstract class SecondaryActivity implements Activity {
    public static Builder builder() {
        return new AutoValue_SecondaryActivity.Builder();
    }

    public abstract String getId();

    public abstract ImmutableSet<String> getInstructors();

    public abstract Schedule getSchedule();

    public abstract Optional<String> getType();

    public abstract String getLocation();

    public abstract Enrollment getEnrollment();

    @AutoValue.Builder
    public abstract static class Builder {
        abstract ImmutableSet.Builder<String> instructorsBuilder();

        public abstract Builder setId(String id);

        public Builder addInstructor(String instructor) {
            this.instructorsBuilder().add(instructor);
            return this;
        }

        public Builder addAllInstructors(Iterable<String> instructor) {
            this.instructorsBuilder().addAll(instructor);
            return this;
        }

        public abstract Builder setSchedule(Schedule schedule);

        public abstract Builder setType(String type);

        public abstract Builder setType(Optional<String> type);

        public abstract Builder setLocation(String location);

        public abstract Builder setEnrollment(Enrollment enrollment);

        public abstract SecondaryActivity build();
    }
}
