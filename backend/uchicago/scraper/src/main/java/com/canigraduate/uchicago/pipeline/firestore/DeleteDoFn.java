package com.canigraduate.uchicago.pipeline.firestore;

import com.canigraduate.uchicago.pipeline.models.Key;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import org.apache.beam.sdk.transforms.DoFn;

import java.util.concurrent.CompletableFuture;
import java.util.stream.Stream;

public class DeleteDoFn extends DoFn<Key, Void> {
    private static CompletableFuture<Void> deleteEntireDocument(DocumentReference doc) {
        try {
            return CompletableFuture.allOf(Stream.concat(Stream.of(CompletableFuture.runAsync(() -> {
                try {
                    doc.delete().get();
                } catch (Exception ex) {
                    throw new RuntimeException(ex);
                }
            })), doc.getCollections().get().stream().map(CollectionReference::get).flatMap(snapshot -> {
                try {
                    return snapshot.get().getDocuments().stream();
                } catch (Exception ex) {
                    throw new RuntimeException(ex);
                }
            }).map(DocumentSnapshot::getReference).map(DeleteDoFn::deleteEntireDocument))
                    .toArray(CompletableFuture[]::new));
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }

    @ProcessElement
    public void processElement(ProcessContext c) {
        Key key = c.element();
        try {
            deleteEntireDocument(FirestoreService.getUChicago()
                    .collection("courses")
                    .document(key.getCourse().orElseThrow(() -> new RuntimeException("Missing course")))
                    .collection("terms")
                    .document(
                            key.getTerm().orElseThrow(() -> new RuntimeException("Missing course")).getTerm())).wait();
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }
}
