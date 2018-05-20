package com.canigraduate.uchicago.collegecatalog;

import com.canigraduate.uchicago.BrowsingSession;
import com.canigraduate.uchicago.models.Course;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableMap;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

import java.io.IOException;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class CollegeCatalog {
    private static final String BASE_URL = "http://collegecatalog.uchicago.edu";
    private static final Pattern TITLE = Pattern.compile("([A-Z]{4} [\\d-]+)\\. +(.+?)\\.?(?: +\\d+ Units\\.)?");

    private static Optional<CourseKey> parseCourseKey(String title) {
        Matcher matcher = TITLE.matcher(Normalizer.normalize(title, Normalizer.Form.NFKD).trim());
        if (!matcher.matches()) {
            return Optional.empty();
        }
        return Optional.of(CourseKey.create(matcher.group(1).trim(), matcher.group(2).trim()));
    }

    public static Map<String, String> getDepartments() throws IOException {
        Document doc = Jsoup.parse(new BrowsingSession().get(BASE_URL + "/thecollege/programsofstudy/"));
        doc.setBaseUri(BASE_URL);
        ImmutableMap.Builder<String, String> builder = new ImmutableMap.Builder<>();
        for (Element link : doc.selectFirst("ul[id='/thecollege/programsofstudy/']").getElementsByTag("li")) {
            builder.put(link.text(), link.selectFirst("a").absUrl("href"));
        }
        return builder.build();
    }

    public static Map<String, Course> getCoursesAndSequences(String url) throws IOException {
        Document doc = Jsoup.parse(new BrowsingSession().get(url));
        List<Element> courseBlocks = doc.select("div.courseblock");
        Map<String, Course.Builder> courseMap = new HashMap<>();
        Optional<String> previousCourse = Optional.empty();
        for (Element block : courseBlocks) {
            Optional<CourseKey> course = Optional.ofNullable(block.selectFirst("p.courseblocktitle"))
                    .flatMap(element -> CollegeCatalog.parseCourseKey(element.text()));
            if (!course.isPresent()) {
                continue;
            }
            Optional<String> description = Optional.ofNullable(block.selectFirst("p.courseblockdesc"))
                    .map(element -> Normalizer.normalize(element.text(), Normalizer.Form.NFKD));
            Optional<String> detail = Optional.ofNullable(block.selectFirst("p.courseblockdetail"))
                    .map(element -> Normalizer.normalize(element.text(), Normalizer.Form.NFKD));
            boolean isSubsequence = block.hasClass("subsequence");
            courseMap.put(course.get().getCourse(), Course.builder()
                    .setDescription(description)
                    .addNote(detail)
                    .setParent(previousCourse.filter(c -> isSubsequence))
                    .setName(course.get().getName())
                    .setPriority(30000));
            if (isSubsequence) {
                previousCourse.map(courseMap::get).ifPresent(c -> c.setLeaf(false));
            } else {
                previousCourse = course.map(CourseKey::getCourse);
            }
        }
        return ImmutableMap.copyOf(courseMap.entrySet()
                .stream()
                .map(entry -> new AbstractMap.SimpleEntry<>(entry.getKey(), entry.getValue().build()))
                .collect(Collectors.toList()));
    }

    @AutoValue
    static abstract class CourseKey {
        static CourseKey create(String newCourse, String newName) {
            return new AutoValue_CollegeCatalog_CourseKey(newCourse, newName);
        }

        public abstract String getCourse();

        public abstract String getName();
    }
}
