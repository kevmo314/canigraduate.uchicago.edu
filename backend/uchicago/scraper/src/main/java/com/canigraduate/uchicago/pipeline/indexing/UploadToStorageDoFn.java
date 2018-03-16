package com.canigraduate.uchicago.pipeline.indexing;

import com.canigraduate.uchicago.firestore.FirestoreService;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PDone;

public class UploadToStorageDoFn extends PTransform<PCollection<KV<String, String>>, PDone> {
    private final String prefix;

    private UploadToStorageDoFn(String prefix) {
        this.prefix = prefix;
    }

    public static UploadToStorageDoFn of(String prefix) {
        return new UploadToStorageDoFn(prefix);
    }

    @Override
    public PDone expand(PCollection<KV<String, String>> input) {
        input.apply(ParDo.of(new DoFn<KV<String, String>, Void>() {
            @ProcessElement
            public void processElement(ProcessContext c) {
                FirestoreService.writeIndex(prefix + "/" + c.element().getKey(), c.element().getValue());
            }
        }));
        return PDone.in(input.getPipeline());
    }
}
