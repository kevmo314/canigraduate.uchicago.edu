package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.ribbit.Ribbit;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;

import java.io.IOException;

public class RibbitDoFn extends DoFn<String, KV<String, Course>> {

    @ProcessElement
    public void processElement(ProcessContext c) {
        try {
            Ribbit.getRecordForCourse(c.element()).ifPresent(course -> c.output(KV.of(c.element(), course)));
        } catch (IOException ex) {
            throw new RuntimeException(ex);
        }
    }
}