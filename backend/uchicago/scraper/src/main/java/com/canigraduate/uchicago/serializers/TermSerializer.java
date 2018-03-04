package com.canigraduate.uchicago.serializers;

import com.canigraduate.uchicago.firestore.models.MapValue;
import com.canigraduate.uchicago.models.Term;
import com.google.common.collect.ImmutableMap;

import java.util.Map;

public class TermSerializer {
    public static Map<String, Object> toMap(Term term) {
        return new ImmutableMap.Builder<String, Object>().put("period", term.getPeriod())
                .put("year", term.getYear())
                .build();
    }

    public static MapValue toMapValue(Term term) {
        return new MapValue().put("period", term.getPeriod()).put("year", term.getYear());
    }
}
