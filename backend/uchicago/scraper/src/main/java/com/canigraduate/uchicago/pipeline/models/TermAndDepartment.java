package com.canigraduate.uchicago.pipeline.models;

import com.canigraduate.uchicago.models.Term;
import com.google.auto.value.AutoValue;

@AutoValue
public abstract class TermAndDepartment {
    public static TermAndDepartment create(Term newTerm, String newDepartment) {
        return new AutoValue_TermAndDepartment(newTerm, newDepartment);
    }

    public abstract Term getTerm();

    public abstract String getDepartment();
}