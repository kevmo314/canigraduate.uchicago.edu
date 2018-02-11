package com.canigraduate.uchicago.pipeline.firestore;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.models.Section;
import com.canigraduate.uchicago.models.Term;
import com.canigraduate.uchicago.pipeline.deserializers.CourseDeserializer;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.canigraduate.uchicago.pipeline.serializers.CourseSerializer;
import com.canigraduate.uchicago.pipeline.serializers.SectionSerializer;
import com.canigraduate.uchicago.pipeline.serializers.TermSerializer;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.common.collect.ImmutableSet;
import com.google.common.collect.Lists;
import com.google.common.collect.Sets;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;

import java.util.Map;
import java.util.logging.Logger;

/**
 * Upload a course to Firestore.
 */
public class UploadDoFn extends DoFn<KV<Key, Course>, Void> {
    private static final Logger LOGGER = Logger.getLogger(UploadDoFn.class.getName());

    @ProcessElement
    public void processElement(ProcessContext c) {
        Key key = c.element().getKey();
        Term term = key.getTerm().orElseThrow(() -> new RuntimeException("Missing term"));
        Course course = c.element().getValue();
        DocumentReference courseRef = FirestoreService.getUChicago()
                .collection("courses")
                .document(key.getCourse().orElseThrow(() -> new RuntimeException("Missing course")));
        // Check if we should upload the course.
        FirestoreService.getFirestore().runTransaction(transaction -> {
            Course current = new CourseDeserializer().apply(transaction.get(courseRef).get().getData());
            Course merged = Course.create(current, course);
            transaction.set(courseRef, new CourseSerializer().apply(merged));
            return null;
        });
        DocumentReference termRef = courseRef.collection("terms").document(term.getTerm());
        termRef.set(new TermSerializer().apply(term));
        if (course.getSections().isEmpty()) {
            // If sections is empty, this course is just metadata.
            return;
        }
        // Tombstones are somewhat of an issue, so we need to pull the sections in the db first and delete them in
        // one transaction.
        FirestoreService.getFirestore().runTransaction(transaction -> {
            CollectionReference sectionsRef = termRef.collection("sections");
            Sets.difference(ImmutableSet.copyOf(
                    Lists.transform(transaction.get(sectionsRef).get().getDocuments(), DocumentSnapshot::getId)),
                    course.getSections().keySet())
                    .forEach(sectionId -> transaction.delete(sectionsRef.document(sectionId)));
            for (Map.Entry<String, Section> section : course.getSections().entrySet()) {
                transaction.set(sectionsRef.document(section.getKey()),
                        new SectionSerializer().apply(section.getValue()));
            }
            return null;
        });
    }
}
