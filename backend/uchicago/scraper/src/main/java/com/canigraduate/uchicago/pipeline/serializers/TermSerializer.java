package com.canigraduate.uchicago.pipeline.serializers;

import com.canigraduate.uchicago.models.Term;
import com.google.common.collect.ImmutableMap;

import java.util.Map;
import java.util.function.Function;

public class TermSerializer implements Function<Term, Map<String, Object>> {
    @Override
    public Map<String, Object> apply(Term term) {
        return new ImmutableMap.Builder().put("period", term.getPeriod()).put("year", term.getYear()).build();
    }
}
