package com.canigraduate.uchicago.models;

import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableMap;
import org.jetbrains.annotations.NotNull;

import java.time.LocalDate;
import java.util.Map;

@AutoValue
public abstract class Term implements Comparable<Term> {
    public static final Term MINIMUM_TERM = Term.create("Autumn 2002");

    private static final Map<String, Integer> PERIOD_MAP = new ImmutableMap.Builder<String, Integer>().put("Winter", 0)
            .put("Spring", 1)
            .put("Summer", 2)
            .put("Autumn", 3)
            .build();

    public static Term create(String newTerm) {
        return new AutoValue_Term(newTerm);
    }

    public abstract String getTerm();

    public int getAge() {
        int reference = 4 * LocalDate.now().getYear() + (LocalDate.now().getMonthValue() - 1) / 4;
        return reference - this.hashCode();
    }

    @Override
    public int hashCode() {
        return 4 * this.getYear() + PERIOD_MAP.get(this.getPeriod());
    }

    public int getYear() {
        return Integer.parseInt(this.getTerm().substring(this.getTerm().length() - 4));
    }

    public boolean isPresentOrFuture() {
        return this.getAge() <= 0;
    }

    public String getPeriod() {
        return this.getTerm().substring(0, 6);
    }

    @Override
    public int compareTo(@NotNull Term that) {
        return this.hashCode() - that.hashCode();
    }

    public int getOrdinal() {
        return PERIOD_MAP.get(this.getPeriod()) + this.getYear() * PERIOD_MAP.size();
    }
}
