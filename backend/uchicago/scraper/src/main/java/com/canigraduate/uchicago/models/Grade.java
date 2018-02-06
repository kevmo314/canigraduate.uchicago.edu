package com.canigraduate.uchicago.models;

import com.google.auto.value.AutoValue;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@AutoValue
abstract class Grade {
    private static final Map<String, Double> GPA_MAP = new HashMap<String, Double>() {{
        this.put("A+", 4.0);
        this.put("A", 4.0);
        this.put("A-", 3.7);
        this.put("B+", 3.3);
        this.put("B", 3.0);
        this.put("B-", 2.7);
        this.put("C+", 2.3);
        this.put("C", 2.0);
        this.put("C-", 1.7);
        this.put("D+", 1.3);
        this.put("D", 1.0);
        this.put("F", 0.0);
    }};

    public static Grade create(String newGrade) {
        return new AutoValue_Grade(newGrade);
    }

    public abstract String getGrade();

    private Optional<Double> getGpa() {
        return Optional.ofNullable(GPA_MAP.get(this.getGrade()));
    }

    public boolean isQuality() {
        return this.getGpa().isPresent();
    }

    public boolean isCredit() {
        return this.getGrade().endsWith("P") || this.getGpa().map(gpa -> gpa > 0).orElse(false);
    }
}
