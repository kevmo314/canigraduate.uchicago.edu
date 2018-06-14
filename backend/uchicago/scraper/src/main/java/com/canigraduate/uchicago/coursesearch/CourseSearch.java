package com.canigraduate.uchicago.coursesearch;

import com.canigraduate.uchicago.models.Course;
import com.canigraduate.uchicago.models.Term;
import com.canigraduate.uchicago.models.Watch;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Element;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class CourseSearch {

    private static Map<Term, String> termToTermID;

    public static Map<Term, String> getTerms() throws IOException {
        if (termToTermID != null) {
            return termToTermID;
        }
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
        return termToTermID = builder.build();
    }

    public static Map<String, String> getDepartments(String termKey) throws IOException {
        Browser browser = new Browser().setId(termKey);
        ImmutableMap.Builder<String, String> builder = new ImmutableMap.Builder<>();
        for (Element option : Jsoup.parse(browser.action("UC_CLSRCH_WRK2_STRM"))
                .select("#UC_CLSRCH_WRK2_SUBJECT option")) {
            if (option.hasAttr("value") && !option.attr("value").isEmpty()) {
                builder.put(option.attr("value"), option.attr("value"));
            }
        }
        return builder.build();
    }

    public static List<String> getCoursePages(String termKey, String department) {
        return IntStream.range(0, 25).parallel().boxed().flatMap(shard -> {
            ImmutableList.Builder<String> builder = new ImmutableList.Builder<>();
            try {
                Scanner scanner = new Scanner(new Browser().setId(termKey), department).setShard(shard);
                while (scanner.hasNext()) {
                    scanner.nextCoursePage().ifPresent(builder::add);
                }
                return builder.build().stream();
            } catch (IOException e) {
                System.err.println("Error when parsing " + termKey + " " + department + " " + shard);
                throw new RuntimeException(e);
            }
        }).collect(Collectors.toList());
    }

    public static Map.Entry<String, Course> getCourseEntry(String page) {
        return Scanner.toCourseEntry(page);
    }

    public static Map<String, Course> getCourses(String termKey, String department) {
        return getCoursePages(termKey, department).stream()
                .map(CourseSearch::getCourseEntry)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, Course::create));
    }

    public static List<String> getCoursePagesWatch(Watch w) {
        return IntStream.range(0, 25).parallel().boxed().flatMap(shard -> {
            ImmutableList.Builder<String> builder = new ImmutableList.Builder<>();
            Term term = null;
            Map<Term, String> termDict = null;
            try {
                term = Term.create(w.getTerm());
                termDict = getTerms();

                Scanner scanner = new Scanner(new Browser().setId(termDict.get(term)), w).setShard(shard);
                while (scanner.hasNext()) {
                    scanner.nextCoursePage().ifPresent(builder::add);
                }
                return builder.build().stream();
            } catch (IOException e) {
                System.err.println("Error when parsing " + termDict.get(term) + " " + w.getTerm() + " " + shard);
                throw new RuntimeException(e);
            }
        }).collect(Collectors.toList());
    }

    public static Map<String, Course> getCoursesFromWatch(Watch w) {
        return getCoursePagesWatch(w).stream()
                .map(CourseSearch::getCourseEntry)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, Course::create));
    }
}
