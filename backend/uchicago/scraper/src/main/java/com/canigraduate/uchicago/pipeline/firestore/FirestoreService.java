package com.canigraduate.uchicago.pipeline.firestore;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;

import java.io.IOException;

public class FirestoreService {
    private static final GoogleCredentials credentials = getCredentials();
    private static Firestore FIRESTORE;

    private static GoogleCredentials getCredentials() {
        try {
            return GoogleCredentials.fromStream(FirestoreService.class.getResourceAsStream("service_account_key.json"));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public synchronized static Firestore getFirestore() {
        if (FIRESTORE == null) {
            FirebaseOptions options = new FirebaseOptions.Builder().setCredentials(credentials).build();
            FirebaseApp.initializeApp(options);
            FIRESTORE = FirestoreClient.getFirestore();
        }
        return FIRESTORE;
    }

    public static DocumentReference getUChicago() {
        return getFirestore().collection("institutions").document("uchicago");
    }
}
