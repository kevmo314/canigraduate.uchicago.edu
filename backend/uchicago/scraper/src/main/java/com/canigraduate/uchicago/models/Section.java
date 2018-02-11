package com.canigraduate.uchicago.models;

import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableSet;

import java.util.Optional;

@AutoValue
public abstract class Section {
    public static Builder builder() {
        return new AutoValue_Section.Builder();
    }

    public static Section create(Section a, Section b) {
        if (a == null && b == null) {
            throw new IllegalArgumentException("Cannot both be null");
        }
        if (a == null) {
            return b;
        }
        if (b == null) {
            return a;
        }
        return builder().addAllNotes(a.getNotes())
                .addAllNotes(b.getNotes())
                .setPrerequisites(a.getPrerequisites().isPresent() ? a.getPrerequisites() : b.getPrerequisites())
                .setEnrollment(a.getEnrollment())
                .addAllPrimaryActivities(a.getPrimaryActivities())
                .addAllSecondaryActivities(a.getSecondaryActivities())
                .addAllPrimaryActivities(b.getPrimaryActivities())
                .addAllSecondaryActivities(b.getSecondaryActivities())
                .build();

    }

    public abstract ImmutableSet<String> getNotes();

    public abstract Optional<String> getPrerequisites();

    public abstract Enrollment getEnrollment();

    public abstract ImmutableSet<PrimaryActivity> getPrimaryActivities();

    public abstract ImmutableSet<SecondaryActivity> getSecondaryActivities();

    @AutoValue.Builder
    public abstract static class Builder {
        abstract ImmutableSet.Builder<String> notesBuilder();

        public Builder addNote(String note) {
            this.notesBuilder().add(note);
            return this;
        }

        public Builder addNote(Optional<String> note) {
            note.ifPresent(this.notesBuilder()::add);
            return this;
        }

        public Builder addAllNotes(Iterable<String> notes) {
            this.notesBuilder().addAll(notes);
            return this;
        }

        public abstract Builder setPrerequisites(String prerequisites);

        public abstract Builder setPrerequisites(Optional<String> prerequisites);

        public abstract Builder setEnrollment(Enrollment enrollment);

        abstract ImmutableSet.Builder<PrimaryActivity> primaryActivitiesBuilder();

        public Builder addPrimaryActivity(PrimaryActivity primaryActivity) {
            this.primaryActivitiesBuilder().add(primaryActivity);
            return this;
        }

        public Builder addAllPrimaryActivities(Iterable<PrimaryActivity> primaryActivities) {
            this.primaryActivitiesBuilder().addAll(primaryActivities);
            return this;
        }

        abstract ImmutableSet.Builder<SecondaryActivity> secondaryActivitiesBuilder();

        public Builder addSecondaryActivity(SecondaryActivity secondaryActivity) {
            this.secondaryActivitiesBuilder().add(secondaryActivity);
            return this;
        }

        public Builder addAllSecondaryActivities(Iterable<SecondaryActivity> secondaryActivities) {
            this.secondaryActivitiesBuilder().addAll(secondaryActivities);
            return this;
        }

        public Builder addActivity(Activity activity) {
            if (activity instanceof PrimaryActivity) {
                return this.addPrimaryActivity((PrimaryActivity) activity);
            }
            if (activity instanceof SecondaryActivity) {
                return this.addSecondaryActivity((SecondaryActivity) activity);
            }
            throw new IllegalArgumentException("Not an addable type " + activity);
        }

        public abstract Section build();
    }
}
