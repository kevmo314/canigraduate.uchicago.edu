package com.canigraduate.uchicago.pipeline.firestore;

import org.junit.Test;

import java.util.concurrent.ExecutionException;

import static org.assertj.core.api.Assertions.assertThat;

public class FirestoreServiceTest {

    @Test
    public void getFirestore() throws ExecutionException, InterruptedException {
        assertThat(FirestoreService.getFirestore().getCollections().get()).isNotEmpty();
    }
}