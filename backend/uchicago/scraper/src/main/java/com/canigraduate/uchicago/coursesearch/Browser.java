package com.canigraduate.uchicago.coursesearch;

import com.canigraduate.uchicago.BrowsingSession;
import com.google.common.collect.ImmutableMap;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

class Browser {
    private static final String COURSE_SEARCH_URL = "https://coursesearch.uchicago.edu/psc/prdguest/EMPLOYEE/HRMS/c/UC_STUDENT_RECORDS_FL.UC_CLASS_SEARCH_FL.GBL";

    private final BrowsingSession session;
    private final HashMap<String, String> data;
    private int counter;
    private String id;
    private Document homepage;

    public Browser() throws IOException {
        this.session = new BrowsingSession();
        this.data = new HashMap<>();
        this.homepage = this.parse(this.session.get("https://coursesearch.uchicago.edu/"));
    }

    public Browser setId(String id) {
        this.id = id;
        return this;
    }

    private synchronized Document parse(Document doc) {
        for (Element element : doc.select("input[name^='IC']")) {
            this.data.put(element.attr("name"), element.attr("value"));
        }
        return doc;
    }

    public Document action(String name) throws IOException {
        return this.action(name, ImmutableMap.of());
    }

    public synchronized Document action(String name, Map<String, String> requestData) throws IOException {
        Map<String, String> data = new HashMap<>(this.data);
        data.put("ICAction", name);
        data.put("ICStateNum", String.valueOf(++this.counter));
        if (this.id != null) {
            data.put("UC_CLSRCH_WRK2_STRM", this.id);
        }
        data.putAll(requestData);
        return this.parse(this.session.post(COURSE_SEARCH_URL, data));
    }

    public Document getHomepage() {
        return this.homepage;
    }
}
