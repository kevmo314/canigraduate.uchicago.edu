package com.canigraduate.uchicago.models;

import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableSet;

import java.util.Optional;

@AutoValue
public abstract class PrimaryActivity implements Activity {
    public static Builder builder() {
        return new AutoValue_PrimaryActivity.Builder();
    }

    public abstract ImmutableSet<String> getInstructors();

    public abstract Schedule getSchedule();

    public abstract Optional<String> getType();

    public abstract String getLocation();

    @AutoValue.Builder
    public abstract static class Builder {
        abstract ImmutableSet.Builder<String> instructorsBuilder();

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

        public abstract PrimaryActivity build();
    }
}
