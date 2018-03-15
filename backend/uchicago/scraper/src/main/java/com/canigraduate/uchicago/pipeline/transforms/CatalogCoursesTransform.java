package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.collegecatalog.CollegeCatalog;
import com.canigraduate.uchicago.models.Course;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.FlatMapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.Values;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PBegin;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptor;

import java.io.IOException;
import java.util.stream.Collectors;

public class CatalogCoursesTransform extends PTransform<PBegin, PCollection<KV<String, Course>>> {
    @Override
    public PCollection<KV<String, Course>> expand(PBegin input) {
        try {
            return input.getPipeline()
                    .apply(Create.of(CollegeCatalog.getDepartments()))
                    .apply(Values.create())
                    .apply(FlatMapElements.into(new TypeDescriptor<KV<String, Course>>() {
                    }).via(e -> {
                        try {
                            return CollegeCatalog.getCoursesAndSequences(e)
                                    .entrySet()
                                    .stream()
                                    .map(entry -> KV.of(entry.getKey(), entry.getValue()))
                                    .collect(Collectors.toList());
                        } catch (IOException ex) {
                            throw new RuntimeException(ex);
                        }
                    }));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
