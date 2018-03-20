package com.canigraduate.uchicago.pipeline.models;

import com.canigraduate.uchicago.models.Term;
import com.google.auto.value.AutoValue;

import java.util.Comparator;

@AutoValue
public abstract class TermKey implements Comparable<TermKey> {
    public static Builder builder() {
        return new AutoValue_TermKey.Builder();
    }

    public abstract Term getTerm();

    public abstract String getCourse();

    @Override
    public int compareTo(TermKey that) {
        return Comparator.comparing(TermKey::getCourse).thenComparing(TermKey::getTerm).compare(this, that);
    }

    @AutoValue.Builder
    public abstract static class Builder {
        public abstract Builder setTerm(Term term);

        public abstract Builder setCourse(String course);

        public abstract TermKey build();
    }
}