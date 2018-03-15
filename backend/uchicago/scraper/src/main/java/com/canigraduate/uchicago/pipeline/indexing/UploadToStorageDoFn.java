package com.canigraduate.uchicago.pipeline.indexing;

import com.canigraduate.uchicago.firestore.FirestoreService;
import com.google.gson.JsonObject;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PDone;

public class UploadToStorageDoFn extends PTransform<PCollection<JsonObject>, PDone> {
    private final String field;

    private UploadToStorageDoFn(String field) {
        this.field = field;
    }

    public static UploadToStorageDoFn of(String field) {
        return new UploadToStorageDoFn(field);
    }

    @Override
    public PDone expand(PCollection<JsonObject> input) {
        input.apply(ParDo.of(new DoFn<JsonObject, Void>() {
            @ProcessElement
            public void processElement(ProcessContext c) {
                FirestoreService.writeJsonIndex(field, c.element());
            }
        }));
        return PDone.in(input.getPipeline());
    }
}
