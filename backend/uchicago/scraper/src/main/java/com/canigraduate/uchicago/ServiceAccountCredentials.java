package com.canigraduate.uchicago;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.OAuth2Credentials;
import com.google.common.collect.ImmutableList;
import org.apache.http.Header;
import org.apache.http.message.BasicHeader;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.Date;
import java.util.List;

public class ServiceAccountCredentials {
    private final List<String> scopes;
    private OAuth2Credentials credentials;
    private BasicHeader header;

    public ServiceAccountCredentials(String... scopes) {
        this.scopes = ImmutableList.copyOf(scopes);
    }

    private boolean isExpired() {
        return this.credentials.getAccessToken().getExpirationTime().before(Date.from(Instant.now().plusSeconds(60)));
    }

    private synchronized void refreshCredentials() {
        if (this.credentials == null || isExpired()) {
            try (InputStream in = ServiceAccountCredentials.class.getResourceAsStream("service_account_key.json")) {
                this.credentials = GoogleCredentials.fromStream(in).createScoped(scopes);
                this.credentials.refresh();
                this.header = new BasicHeader("Authorization",
                        "Bearer " + this.credentials.getAccessToken().getTokenValue());
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    }

    public Header getAuthorizationHeader() {
        refreshCredentials();
        return this.header;
    }

    public OAuth2Credentials getCredentials() {
        refreshCredentials();
        return this.credentials;
    }
}
