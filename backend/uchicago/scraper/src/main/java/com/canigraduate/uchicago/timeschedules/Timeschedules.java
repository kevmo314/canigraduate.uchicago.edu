package com.canigraduate.uchicago.timeschedules;

import com.canigraduate.uchicago.BrowsingSession;
import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.models.Term;
import com.google.common.collect.ImmutableMap;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

import java.io.IOException;
import java.net.URL;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

class Timeschedules {
    private static final String BASE_URL = "http://timeschedules.uchicago.edu/";

    public static Map<Term, String> getTerms() throws IOException {
        ImmutableMap.Builder<Term, String> builder = new ImmutableMap.Builder<>();
        Document doc = new BrowsingSession().get(BASE_URL + "browse.php");
        for (Element option : doc.select("select#term_name option")) {
            if (option.hasAttr("value")) {
                Term term = Term.create(option.text().trim());
                if (term.compareTo(Term.MINIMUM_TERM) >= 0) {
                    builder.put(term, option.attr("value"));
                }
            }
        }
        return builder.build();
    }

    public static Map<String, String> getDepartments(String termKey) throws IOException {
        ImmutableMap.Builder<String, String> builder = new ImmutableMap.Builder<>();
        Set<String> visited = new HashSet<>();
        Document doc = new BrowsingSession().get(BASE_URL + "browse.php?term=" + termKey + "&submit=Submit");
        for (Element link : doc.select("a[href]")) {
            URL href = new URL(link.absUrl("href"));
            if (href.getPath().equals("/view.php")) {
                String[] tokens = href.getQuery().split("&");
                for (String token : tokens) {
                    String dept = token.substring(5);
                    if (token.startsWith("dept=") && !visited.contains(dept)) {
                        builder.put(dept, link.absUrl("href"));
                        visited.add(dept);
                        break;
                    }
                }
            }
        }
        return builder.build();
    }

    public static Map<String, Course> getCourses(String url) throws IOException {
        Document doc = new BrowsingSession().get(url);
        Map<String, Course> courses = new HashMap<>();
        for (Element table : doc.getElementsByTag("tbody")) {
            Scanner scanner = new Scanner(table.getElementsByTag("td"));
            while (scanner.hasNext()) {
                Map.Entry<String, Course> entry = scanner.nextCourseEntry();
                courses.put(entry.getKey(), Course.create(courses.get(entry.getKey()), entry.getValue()));
            }
        }
        return ImmutableMap.copyOf(courses);
    }
}
