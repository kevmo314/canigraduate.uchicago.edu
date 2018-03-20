package com.canigraduate.uchicago.pipeline.firestore;

import com.canigraduate.uchicago.firestore.Terms;
import com.canigraduate.uchicago.pipeline.models.TermKey;
import org.apache.beam.sdk.transforms.DoFn;

public class DeleteDoFn extends DoFn<TermKey, Void> {
    @ProcessElement
    public void processElement(ProcessContext c) {
        new Terms(c.element().getCourse()).delete(c.element().getTerm().getTerm());
    }
}
