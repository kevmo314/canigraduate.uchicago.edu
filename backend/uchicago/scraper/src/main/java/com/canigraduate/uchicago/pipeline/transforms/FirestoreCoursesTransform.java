package com.canigraduate.uchicago.pipeline.transforms;

import com.canigraduate.uchicago.models.Term;
import com.canigraduate.uchicago.pipeline.firestore.FirestoreService;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.FlatMapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.values.PBegin;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptor;

import java.util.List;
import java.util.stream.Collectors;

public class FirestoreCoursesTransform extends PTransform<PBegin, PCollection<Key>> {
    @Override
    public PCollection<Key> expand(PBegin input) {
        ApiFuture<QuerySnapshot> coursesFuture = FirestoreService.getUChicago().collection("courses").get();
        List<String> documentIds;
        try {
            documentIds = coursesFuture.get()
                    .getDocuments()
                    .stream()
                    .map(DocumentSnapshot::getId)
                    .collect(Collectors.toList());
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
        return input.getPipeline()
                .apply(Create.of(documentIds))
                .apply(FlatMapElements.into(TypeDescriptor.of(Key.class)).via(course -> {
                    try {
                        DocumentReference courseRef = FirestoreService.getUChicago()
                                .collection("courses")
                                .document(course);
                        ApiFuture<QuerySnapshot> termsFuture = courseRef.collection("terms").get();
                        Key key = Key.builder()
                                .setCourse(course)
                                .setDepartment((String) courseRef.get().get().get("department"))
                                .build();
                        return termsFuture.get()
                                .getDocuments()
                                .stream()
                                .map(DocumentSnapshot::getId)
                                .map(Term::create)
                                .map(key::withTerm)
                                .collect(Collectors.toList());
                    } catch (Exception ex) {
                        throw new RuntimeException(ex);
                    }
                }));
    }
}
