package com.canigraduate.uchicago.pipeline.indexing;

import com.google.common.primitives.Chars;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptors;

import java.util.List;

public class PackIntegerArray extends PTransform<PCollection<List<Integer>>, PCollection<String>> {
    public static String pack(List<Integer> values) {
        char[] bytes = new char[values.size() * 2];
        int i = 0;
        for (int value : values) {
            bytes[i++] = Chars.checkedCast((value & 0xFFFF0000) >> 16);
            bytes[i++] = Chars.checkedCast((value & 0x0000FFFF));
        }
        return new String(bytes);
    }

    @Override
    public PCollection<String> expand(PCollection<List<Integer>> input) {
        return input.apply(MapElements.into(TypeDescriptors.strings()).via(PackIntegerArray::pack));
    }
}
