package com.canigraduate.uchicago.pipeline.firestore;

import com.canigraduate.uchicago.firestore.Terms;
import com.canigraduate.uchicago.pipeline.models.Key;
import org.apache.beam.sdk.transforms.DoFn;

public class DeleteDoFn extends DoFn<Key, Void> {
    @ProcessElement
    public void processElement(ProcessContext c) {
        String course = c.element().getCourse().orElseThrow(() -> new RuntimeException("Missing course"));
        String term = c.element().getTerm().orElseThrow(() -> new RuntimeException("Missing course")).getTerm();
        new Terms(course).delete(term);
    }
}
