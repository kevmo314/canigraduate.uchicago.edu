package com.canigraduate.uchicago.pipeline;

import com.google.common.collect.ImmutableSortedSet;
import org.apache.beam.sdk.transforms.Distinct;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.View;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionView;
import org.apache.beam.sdk.values.TypeDescriptors;

import java.util.List;

public class SortedView<T> extends PTransform<PCollection<T>, PCollectionView<List<T>>> {
    public static <T> PTransform<PCollection<T>, PCollectionView<List<T>>> of() {
        return new SortedView<>();
    }

    @Override
    public PCollectionView<List<T>> expand(PCollection<T> input) {
        return input.apply(new Distinct<>())
                .apply(new ReduceElements<>())
                .apply(MapElements.into(TypeDescriptors.lists(input.getTypeDescriptor()))
                        .via(elements -> ImmutableSortedSet.copyOf(elements).asList()))
                .apply(View.asSingleton());
    }
}
