package com.canigraduate.uchicago.collegecatalog;

import com.canigraduate.uchicago.BrowsingSession;
import com.canigraduate.uchicago.models.Course;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableMap;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

import java.io.IOException;
import java.text.Normalizer;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CollegeCatalog {
    private static final String BASE_URL = "http://collegecatalog.uchicago.edu";
    private static final Pattern TITLE = Pattern.compile("([^.]+)\\. +(.+?)\\.?(?: +\\d+ Units\\.)?");

    private static Optional<CourseKey> parseCourseKey(String title) {
        Matcher matcher = TITLE.matcher(Normalizer.normalize(title, Normalizer.Form.NFKD).trim());
        if (!matcher.matches()) {
            return Optional.empty();
        }
        return Optional.of(CourseKey.create(matcher.group(1).trim(), matcher.group(2).trim()));
    }

    public static Map<String, String> getDepartments() throws IOException {
        Document doc = new BrowsingSession().get(BASE_URL + "/thecollege/programsofstudy/");
        ImmutableMap.Builder<String, String> builder = new ImmutableMap.Builder<>();
        for (Element link : doc.selectFirst("ul[id='/thecollege/programsofstudy/']").getElementsByTag("li")) {
            builder.put(link.text(), link.selectFirst("a").absUrl("href"));
        }
        return builder.build();
    }

    public static Map<String, Course> getCourses(String url) throws IOException {
        Document doc = new BrowsingSession().get(url);
        Element courses = doc.selectFirst("div.courses");
        if (courses == null) {
            return ImmutableMap.of();
        }
        List<Element> courseBlocks = courses.select("div.courseblock");
        ImmutableMap.Builder<String, Course> builder = new ImmutableMap.Builder<>();
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
            boolean isSequence = block.hasClass("subsequence");
            builder.put(course.get().getCourse(), Course.builder()
                    .setDescription(description)
                    .addNote(detail)
                    .setSequence(previousCourse)
                    .setName(course.get().getName())
                    .setPriority(30000)
                    .build());
            if (!isSequence) {
                previousCourse = course.map(CourseKey::getCourse);
            }
        }
        return builder.build();
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
