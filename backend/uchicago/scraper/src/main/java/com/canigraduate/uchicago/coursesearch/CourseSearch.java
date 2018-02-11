package com.canigraduate.uchicago.coursesearch;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.models.Term;
import com.google.common.collect.ImmutableMap;
import org.jsoup.nodes.Element;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class CourseSearch {
    public static Map<Term, String> getTerms() throws IOException {
        Browser browser = new Browser();
        ImmutableMap.Builder<Term, String> builder = new ImmutableMap.Builder<>();
        for (Element option : browser.getHomepage().select("select#UC_CLSRCH_WRK2_STRM option")) {
            if (option.hasAttr("value") && !option.attr("value").isEmpty()) {
                Term term = Term.create(option.text().trim());
                if (term.compareTo(Term.MINIMUM_TERM) >= 0) {
                    builder.put(term, option.attr("value"));
                }
            }
        }
        return builder.build();
    }

    public static Map<String, String> getDepartments(String termKey) throws IOException {
        Browser browser = new Browser().setId(termKey);
        ImmutableMap.Builder<String, String> builder = new ImmutableMap.Builder<>();
        for (Element option : browser.action("UC_CLSRCH_WRK2_STRM").select("#UC_CLSRCH_WRK2_SUBJECT option")) {
            if (option.hasAttr("value") && !option.attr("value").isEmpty()) {
                builder.put(option.attr("value"), option.attr("value"));
            }
        }
        return builder.build();
    }

    public static Map<String, Course> getCourses(String termKey, String department, int shard) throws IOException {
        Scanner scanner = new Scanner(new Browser().setId(termKey), department).setShard(shard);
        Map<String, Course> courses = new HashMap<>();
        while (scanner.hasNext()) {
            scanner.nextCourseEntry()
                    .ifPresent(entry -> courses.put(entry.getKey(),
                            Course.create(courses.get(entry.getKey()), entry.getValue())));
        }
        return ImmutableMap.copyOf(courses);
    }
}
