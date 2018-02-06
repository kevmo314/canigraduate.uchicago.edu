package com.canigraduate.uchicago.models;

import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableSet;
import com.google.common.collect.Sets;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@AutoValue
public abstract class Course {
    public static Builder builder() {
        return new AutoValue_Course.Builder().setPriority(0);
    }

    public static Course create(Course a, Course b) {
        if (a == null && b == null) {
            throw new IllegalArgumentException("Cannot both be null");
        }
        if (a == null) {
            return b;
        }
        if (b == null) {
            return a;
        }
        Course p = a.getPriority() >= b.getPriority() ? a : b;
        Course q = a.getPriority() >= b.getPriority() ? b : a;
        Map<String, Section> sections = new HashMap<>();
        for (Map.Entry<String, Section> entry : Sets.union(a.getSections().entrySet(), b.getSections().entrySet())) {
            sections.put(entry.getKey(), Section.create(sections.get(entry.getKey()), entry.getValue()));
        }
        return builder().setName(p.getName().isEmpty() ? q.getName() : p.getName())
                .setDescription(p.getDescription().isPresent() ? p.getDescription() : q.getDescription())
                .addAllNotes(a.getNotes())
                .addAllNotes(b.getNotes())
                .setSequence(p.getSequence().isPresent() ? p.getSequence() : q.getSequence())
                .setPriority(p.getPriority())
                .putAllSections(a.getSections())
                .putAllSections(b.getSections())
                .addAllCrosslists(a.getCrosslists())
                .addAllCrosslists(b.getCrosslists())
                .build();
    }

    public abstract String getName();

    public abstract Optional<String> getDescription();

    public abstract ImmutableSet<String> getNotes();

    public abstract Optional<String> getSequence();

    public abstract int getPriority();

    public abstract ImmutableMap<String, Section> getSections();

    public Section getSection(String key) {
        return this.getSections().get(key);
    }

    public abstract ImmutableSet<String> getCrosslists();

    @AutoValue.Builder
    public abstract static class Builder {
        public abstract Builder setName(String name);

        public abstract Builder setDescription(String description);

        public abstract Builder setDescription(Optional<String> description);

        abstract ImmutableSet.Builder<String> notesBuilder();

        public Builder addNote(String note) {
            this.notesBuilder().add(note);
            return this;
        }

        public Builder addNote(Optional<String> note) {
            note.ifPresent(this.notesBuilder()::add);
            return this;
        }

        Builder addAllNotes(Iterable<String> notes) {
            this.notesBuilder().addAll(notes);
            return this;
        }

        public abstract Builder setSequence(String sequence);

        public abstract Builder setSequence(Optional<String> sequence);

        public abstract Builder setPriority(int priority);

        abstract ImmutableMap.Builder<String, Section> sectionsBuilder();

        public Builder putSection(String key, Section section) {
            this.sectionsBuilder().put(key, section);
            return this;
        }

        public Builder putAllSections(Iterable<? extends Map.Entry<String, Section>> sections) {
            this.sectionsBuilder().putAll(sections);
            return this;
        }

        Builder putAllSections(Map<String, Section> sections) {
            this.sectionsBuilder().putAll(sections);
            return this;
        }

        abstract ImmutableSet.Builder<String> crosslistsBuilder();

        public Builder addCrosslist(String crosslist) {
            this.crosslistsBuilder().add(crosslist);
            return this;
        }

        public Builder addAllCrosslists(Iterable<String> crosslists) {
            this.crosslistsBuilder().addAll(crosslists);
            return this;
        }

        public abstract Course build();
    }
}
