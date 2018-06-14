package com.canigraduate.uchicago.coursesearch;

import com.canigraduate.uchicago.models.*;
import com.google.common.collect.ImmutableMap;
import org.apache.logging.log4j.ThreadContext;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

import java.io.IOException;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

class Scanner {
    private static final Logger LOGGER = Logger.getLogger(Scanner.class.getName());
    private static final Pattern DESCRIPTOR_REGEX = Pattern.compile(
            "(?<id>[A-Z]{4} [0-9]{5})/(?<section>[0-9A-Za-z]+) \\[(?<sectionId>[0-9]+)] - (?<type>[A-Z]+).+");
    private static final Pattern SECTION_REGEX = Pattern.compile(
            "Section (?<section>[0-9A-Za-z]+) \\[(?<sectionId>[0-9]+)] - (?<type>[A-Z]+).+");
    private final Browser browser;
    private int shard;
    private Document activePage;

    Scanner(Browser browser, String department) throws IOException {
        this.browser = browser;
        this.browser.action("UC_CLSRCH_WRK2_STRM");
        this.activePage = Jsoup.parse(this.browser.action("UC_CLSRCH_WRK2_SEARCH_BTN",
                ImmutableMap.of("UC_CLSRCH_WRK2_SUBJECT", department)));
    }

    Scanner(Browser browser, Watch watch) throws IOException {
        this.browser = browser;
        this.browser.action("UC_CLSRCH_WRK2_STRM");
        this.activePage = Jsoup.parse(this.browser.action("UC_CLSRCH_WRK2_SEARCH_BTN",
                ImmutableMap.of("UC_CLSRCH_WRK2_PTUN_KEYWORD", watch.getCourse())));
    }

    private static Optional<String> selectFirstText(Document page, String query) {
        return Optional.ofNullable(page.selectFirst(query))
                .map(element -> element.text().trim())
                .filter(str -> !str.isEmpty());
    }

    public static Map.Entry<String, Course> toCourseEntry(String html) {
        Document page = Jsoup.parse(html);
        String name = selectFirstText(page, "span[id='UC_CLS_DTL_WRK_UC_CLASS_TITLE$0']").orElseThrow(
                () -> new IllegalStateException("Missing course name."));
        String descriptor = selectFirstText(page, "div[id='win0divUC_CLS_DTL_WRK_HTMLAREA$0']").orElseThrow(
                () -> new IllegalStateException("Missing course descriptor."));
        Matcher descriptorMatcher = DESCRIPTOR_REGEX.matcher(descriptor);
        if (!descriptorMatcher.matches()) {
            LOGGER.log(Level.WARNING, "Could not match course descriptor: " + descriptor);
        }
        String courseId = descriptorMatcher.group("id");
        ThreadContext.push(courseId);
        String sectionId = descriptorMatcher.group("section");
        List<String> components = selectFirstText(page, "div[id='win0divUC_CLS_DTL_WRK_SSR_COMPONENT_LONG$0']").map(
                text -> Stream.of(text.split(",")).map(String::trim).collect(Collectors.toList()))
                .orElse(new ArrayList<>());
        Section.Builder sectionBuilder = Section.builder()
                .setPrerequisites(selectFirstText(page, "span[id='UC_CLS_DTL_WRK_SSR_REQUISITE_LONG$0']"))
                .addNote(selectFirstText(page, "span[id='DERIVED_CLSRCH_SSR_CLASSNOTE_LONG$0']"))
                .setEnrollment(nextEnrollment(page));
        page.select("[id^='win0divUC_CLS_REL_WRK_RELATE_CLASS_NBR_1']").forEach(table -> {
            if (table.parents().stream().anyMatch(element -> element.hasClass("psc_hidden"))) {
                // AIS renders random shit sometimes.
                return;
            }
            String component = table.selectFirst("h1").text().trim();
            if (!components.remove(component)) {
                LOGGER.warning("Secondary component " + component + " not recognized.");
            }
            for (Element secondaryRow : table.getElementsByTag("tr")) {
                toSecondaryActivity(secondaryRow).map(activity -> activity.setType(component).build())
                        .ifPresent(sectionBuilder::addSecondaryActivity);
            }
        });

        List<Element> primaryRows = page.select("[id='win0divSSR_CLSRCH_MTG1$0'] tr.ps_grid-row");
        if (components.size() != 1 && components.size() != primaryRows.size()) {
            LOGGER.log(Level.WARNING, String.format("Could not uniquely resolve components %s", components.toString()));
        }
        for (int i = 0; i < primaryRows.size(); i++) {
            String primaryComponent = null;
            if (components.size() == 1) {
                primaryComponent = components.get(0);
            } else if (components.size() == primaryRows.size()) {
                primaryComponent = components.get(i);
            }
            sectionBuilder.addPrimaryActivity(
                    toPrimaryActivity(primaryRows.get(i)).setType(Optional.ofNullable(primaryComponent)).build());
        }
        ThreadContext.pop();
        return new AbstractMap.SimpleEntry<>(courseId, Course.builder()
                .setName(name)
                .setDescription(selectFirstText(page, "span[id='UC_CLS_DTL_WRK_DESCRLONG$0']"))
                .putSection(sectionId, sectionBuilder.build())
                .addAllCrosslists(nextCrosslists(page))
                .build());
    }

    private static PrimaryActivity.Builder toPrimaryActivity(Element row) {
        return PrimaryActivity.builder()
                .addAllInstructors(Arrays.asList(row.selectFirst("span[id^='MTG$']").text().trim().split(",")))
                .setSchedule(Schedule.parse(row.selectFirst("span[id^='MTG_SCHED']").text().trim()))
                .setLocation(row.selectFirst("span[id^='MTG_LOC']").text().trim());
    }

    private static Optional<SecondaryActivity.Builder> toSecondaryActivity(Element row) {
        String descriptor = Optional.ofNullable(row.selectFirst("div[id^='win0divDISC_HTM$']"))
                .map(element -> element.text().trim())
                .orElseThrow(() -> new IllegalStateException("Missing descriptor."));
        Matcher descriptorMatcher = SECTION_REGEX.matcher(descriptor);
        if (!descriptorMatcher.matches()) {
            if (descriptor.isEmpty()) {
                return Optional.empty();
            }
            throw new IllegalStateException("Unmatched descriptor: " + descriptor);
        }
        String[] tokens = row.selectFirst("div[id^='win0divUC_CLS_REL_WRK_DESCR1$445$$']").text().trim().split(" ");
        String[] enrollment = tokens[tokens.length - 1].split("/");
        return Optional.of(SecondaryActivity.builder()
                .setId(descriptorMatcher.group("section"))
                .setEnrollment(Enrollment.builder()
                        .setEnrolled(Integer.parseInt(enrollment[0]))
                        .setMaximum(Integer.parseInt(enrollment[1]))
                        .build())
                .addAllInstructors(Arrays.asList(row.selectFirst("div[id^='win0divDISC_INSTR$']").text().split(",")))
                .setSchedule(Schedule.parse(row.selectFirst("div[id^='win0divDISC_SCHED$']").text().trim()))
                .setLocation(row.selectFirst("div[id^='win0divDISC_ROOM$']").text().trim()));
    }

    private static Enrollment nextEnrollment(Document page) {
        String[] tokens = selectFirstText(page, "span[id='UC_CLS_DTL_WRK_DESCR3$0']").orElseGet(
                () -> selectFirstText(page, "span[id='UC_CLS_DTL_WRK_DESCR1$0']").orElseThrow(
                        () -> new IllegalStateException("Could not resolve enrollment."))).split(" ");
        String[] enrollment = tokens[tokens.length - 1].split("/");
        return Enrollment.builder()
                .setEnrolled(Integer.parseInt(enrollment[0]))
                .setMaximum(Integer.parseInt(enrollment[1]))
                .build();
    }

    private static List<String> nextCrosslists(Document page) {
        return page.select("select[id='UC_CLS_DTL_WRK_DESCR125$0'] option")
                .stream()
                .map(element -> element.text().split("/")[0].trim())
                .filter(value -> !value.isEmpty())
                .collect(Collectors.toList());
    }

    public Scanner setShard(int shard) {
        this.shard = shard;
        return this;
    }

    public boolean hasNext() {
        return this.activePage != null && this.activePage.select("tr[id^='DESCR100']").size() > this.shard;
    }

    private void nextPage() throws IOException {
        // Trigger the next page.
        if (this.activePage.selectFirst("a[id='UC_RSLT_NAV_WRK_SEARCH_CONDITION2$46$']") != null) {
            this.activePage = Jsoup.parse(this.browser.action("UC_RSLT_NAV_WRK_SEARCH_CONDITION2$46$"));
        } else {
            this.activePage = null;
        }
    }

    public Optional<String> nextCoursePage() throws IOException {
        Optional<String> error = selectFirstText(this.activePage, "span[id='DERIVED_CLSMG_ERROR_TEXT']");
        if (error.isPresent() && this.shard <= 0) {
            // Only the first index shard should report page-level errors.
            LOGGER.log(Level.WARNING, error.get());
        }
        Element row = this.activePage.select("tr[id^='DESCR100']").get(this.shard);
        if (Optional.ofNullable(row.selectFirst("span.label"))
                .map(label -> label.text().trim().equals("Cancelled"))
                .orElse(false)) {
            // Ignore cancelled courses.
            this.nextPage();
            return Optional.empty();
        }
        if (row.selectFirst("span[id^='UC_CLSRCH_WRK_UC_CLASS_TITLE$']").text().trim().isEmpty() || row.selectFirst(
                "div[id^='win0divUC_RSLT_NAV_WRK_HTMLAREA$']").text().trim().isEmpty()) {
            // Sometimes you get an empty course or the descriptor is missing...
            this.nextPage();
            return Optional.empty();
        }
        String childPage = this.browser.action("UC_RSLT_NAV_WRK_PTPG_NUI_DRILLOUT$" + this.shard);
        // Return to the index page.
        this.browser.action("UC_CLS_DTL_WRK_RETURN_PB$0");
        this.nextPage();
        return Optional.of(childPage);
    }
}
