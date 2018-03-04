package com.canigraduate.uchicago.timeschedules;

import com.canigraduate.uchicago.models.*;
import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableSet;
import com.google.common.collect.ImmutableSortedSet;
import org.jsoup.nodes.Element;

import java.util.*;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

class Scanner {
    private static final Logger LOGGER = Logger.getLogger(Scanner.class.getName());
    private static final Pattern ID_PATTERN = Pattern.compile("([A-Z]{4})\\s/\\s(\\d{5})\\s-\\s(.+)");
    private final Element[] cells;
    private Section section = null;
    private Course course = null;
    private int index;

    Scanner(List<Element> cells) {
        this.cells = cells.toArray(new Element[]{});
        this.index = this.cells.length;
        for (int i = 0; i < this.cells.length; i++) {
            if (!this.cells[i].hasAttr("colspan")) {
                this.index = i;
                break;
            }
        }
    }

    public boolean hasNext() {
        return this.index < this.cells.length;
    }

    public Optional<Map.Entry<String, Course>> nextCourseEntry() {
        Preconditions.checkState(this.peek().parent().tagName().equals("tr"), "Parent is not a row.");
        Preconditions.checkState(this.peek().parent().child(0).equals(this.peek()),
                "Did not start at beginning of row.");
        Preconditions.checkState(!this.peek().attr("colspan").equals("24"), "Not a parsable course.");
        String text = this.nextString();
        Matcher matcher = ID_PATTERN.matcher(text);
        if (!matcher.matches()) {
            this.skip(13);
            if (!text.isEmpty()) {
                LOGGER.warning("Invalid parsing: " + text);
            }
            return Optional.empty();
        }
        String department = matcher.group(1);
        String ordinal = matcher.group(2);
        String sectionId = matcher.group(3);
        String name = this.nextString();
        if (name.equals("CANCELLED")) {
            // Skip this entry.
            this.skip(12);
            return Optional.empty();
        }
        String units = this.nextString();
        Activity activity = this.nextActivity();
        this.index -= 6;
        Enrollment enrollment = this.nextEnrollment();
        this.index += 2;
        ImmutableSet<String> crosslists = this.nextCrosslists();
        this.index += 1;
        Course.Builder courseBuilder = Course.builder().setName(name).addAllCrosslists(crosslists);
        Section.Builder sectionBuilder = Section.builder().setEnrollment(enrollment).addActivity(activity);
        while (this.hasNext()) {
            try {
                String note = this.nextNote();
                if (!note.isEmpty()) {
                    sectionBuilder.addNote(note);
                }
                continue;
            } catch (IllegalStateException ex) {
                // Ignore, try adding an activity.
            }
            String check = this.nextString();
            this.index--;
            if (check.split("\\s[/-]\\s").length == 3) {
                break;
            }
            this.index += 3;
            sectionBuilder.addActivity(this.nextActivity());
        }
        return Optional.of(new AbstractMap.SimpleImmutableEntry<>(String.format("%s %s", department, ordinal),
                courseBuilder.putSection(sectionId, sectionBuilder.build()).build()));
    }

    private void skip(int delta) {
        this.index += delta;
        while (this.hasNext() && this.peek().attr("colspan").equals("24")) {
            this.index++;
        }
    }

    private Element peek() {
        return this.cells[this.index];
    }

    private Element next() {
        return this.cells[this.index++];
    }

    private String nextString() {
        return this.next().text().trim();
    }

    private Schedule nextSchedule() {
        return Schedule.parse(this.nextString().replaceAll("\\s+", ""));
    }

    private String nextNote() {
        Preconditions.checkState(this.peek().attr("colspan").equals("24"));
        return this.nextString();
    }

    private Enrollment nextEnrollment() {
        OptionalInt enrollment;
        try {
            enrollment = OptionalInt.of(Integer.parseInt(this.nextString()));
        } catch (NumberFormatException e) {
            enrollment = OptionalInt.empty();
        }
        OptionalInt enrollmentLimit;
        try {
            enrollmentLimit = OptionalInt.of(Integer.parseInt(this.nextString()));
        } catch (NumberFormatException e) {
            enrollmentLimit = OptionalInt.empty();
        }
        return Enrollment.builder().setEnrolled(enrollment).setMaximum(enrollmentLimit).build();
    }

    private ImmutableSet<String> nextCrosslists() {
        ImmutableSet.Builder<String> builder = new ImmutableSortedSet.Builder<>(String::compareTo);
        String[] tokens = this.nextString().split(",");
        for (String token : tokens) {
            token = token.trim();
            if (!token.isEmpty()) {
                builder.add(token);
            }
        }
        return builder.build();
    }

    private Activity nextActivity() {
        List<String> instructors = Arrays.stream(this.nextString().split(";"))
                .map(String::trim)
                .collect(Collectors.toList());
        Schedule schedule = this.nextSchedule();
        String sectionType = this.nextString();
        String activityId = this.nextString();
        String activityType = this.nextString();
        Enrollment enrollment = this.nextEnrollment();
        String location = this.nextString().replaceAll("\\s+-", "-");
        this.index += 3;
        if (activityType.isEmpty()) {
            return PrimaryActivity.builder().addAllInstructors(instructors)
                    .setSchedule(schedule)
                    .setType(sectionType)
                    .setLocation(location)
                    .build();
        } else {
            return SecondaryActivity.builder().setId(activityId).addAllInstructors(instructors)
                    .setSchedule(schedule)
                    .setType(activityType)
                    .setLocation(location)
                    .setEnrollment(enrollment)
                    .build();
        }
    }
}
