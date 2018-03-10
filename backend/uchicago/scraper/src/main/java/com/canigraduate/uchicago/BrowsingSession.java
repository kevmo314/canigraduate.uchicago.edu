package com.canigraduate.uchicago;

import org.jsoup.Connection;
import org.jsoup.Jsoup;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class BrowsingSession {
    private final Map<String, String> cookies;
    private final int retries;

    public BrowsingSession() {
        this.cookies = new HashMap<>();
        this.retries = 3;
    }

    private String fetch(Connection connection) throws IOException {
        for (int i = 0; i < this.retries; i++) {
            try {
                Connection.Response response = connection.cookies(this.cookies)
                        .userAgent("Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)")
                        .timeout(30 * 1000).maxBodySize(0)
                        .execute();
                if (response.statusCode() != 200) {
                    throw new IOException("HTTP response status: " + response.statusCode());
                }
                this.cookies.putAll(response.cookies());
                return response.body();
            } catch (IOException ex) {
                if (i == this.retries - 1) {
                    throw ex;
                }
            }
        }
        throw new IOException("Retries failed");

    }

    public String get(String url) throws IOException {
        return this.fetch(Jsoup.connect(url).method(Connection.Method.GET));
    }

    public String post(String url, Map<String, String> data) throws IOException {
        return this.fetch(Jsoup.connect(url).method(Connection.Method.POST).data(data));
    }
}
