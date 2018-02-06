package com.canigraduate.uchicago.ribbit;

import com.canigraduate.uchicago.BrowsingSession;
import com.canigraduate.uchicago.models.Course;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

import java.io.IOException;
import java.text.Normalizer;
import java.util.Optional;
import java.util.logging.Logger;
import java.util.regex.Pattern;

class Ribbit {
    private static final String BASE_URL = "http://collegecatalog.uchicago.edu/ribbit/index.cgi?page=getcourse.rjs&code=";
    private static final Logger LOG = Logger.getLogger(Ribbit.class.getName());
    private static final Pattern TITLE_PATTERN = Pattern.compile("([^.]+)\\. (.+?)\\.?(?: +(\\d+) Units\\.)?");

    public static Course getRecordForCourse(String course) throws IOException {
        Document cdata = Jsoup.parse(new BrowsingSession().get(Ribbit.BASE_URL + course).text());
        return Optional.ofNullable(cdata.selectFirst("p.courseblocktitle"))
                .map(element -> Ribbit.TITLE_PATTERN.matcher(
                        Normalizer.normalize(element.text(), Normalizer.Form.NFKD).trim()))
                .map(matcher -> {
                    if (!matcher.matches()) {
                        return null;
                    }
                    return Course.builder()
                            .setName(matcher.group(2))
                            .setDescription(Optional.ofNullable(cdata.selectFirst("p.courseblockdesc"))
                                    .map(element -> Normalizer.normalize(element.text(), Normalizer.Form.NFKD)))
                            .setPriority(20000)
                            .build();
                })
                .orElse(null);
    }
}
