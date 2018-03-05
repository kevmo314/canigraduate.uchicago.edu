package com.canigraduate.uchicago;

import com.google.auth.oauth2.GoogleCredentials;

import java.io.IOException;
import java.util.List;

public class ServiceAccountCredentials {
    public static GoogleCredentials getCredentials(List<String> scopes) {
        try {
            GoogleCredentials credentials = GoogleCredentials.fromStream(
                    ServiceAccountCredentials.class.getResourceAsStream("service_account_key.json"))
                    .createScoped(scopes);
            credentials.refresh();
            return credentials;
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
