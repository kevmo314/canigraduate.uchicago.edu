package com.canigraduate.uchicago.timeschedules;

import com.canigraduate.uchicago.models.*;
import com.google.common.collect.ImmutableSet;
import com.google.common.collect.ImmutableSortedSet;
import org.jsoup.nodes.Element;

import java.util.*;

class Scanner {
    private final List<Element> cells;
    private Section section = null;
    private Course course = null;
    private int index;

    Scanner(List<Element> cells) {
        this.cells = cells;
        for (int i = 0; i < this.cells.size(); i++) {
            if (!this.cells.get(i).hasAttr("colspan")) {
                this.index = i;
                break;
            }
        }
    }

    public boolean hasNext() {
        return this.index < this.cells.size();
    }

    public Map.Entry<String, Course> nextCourseEntry() {
        String text = this.nextString();
        String[] data = text.split("\\s[/-]\\s");
        for (int i = 0; i < data.length; i++) {
            data[i] = data[i].trim();
        }
        if (data.length != 3 || data[0].length() + data[1].length() != 9) {
            this.index--;
            throw new IllegalStateException("Invalid parsing");
        }
        String name = this.nextString();
        String units = this.nextString();
        Activity activity = this.nextActivity();
        this.index -= 6;
        Enrollment enrollment = this.nextEnrollment();
        this.index += 2;
        ImmutableSet<String> crosslists = this.nextCrosslists();
        this.index += 1;
        if (name.equals("CANCELLED")) {
            // Skip this entry.
            return this.nextCourseEntry();
        }
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
            try {
                sectionBuilder.addActivity(this.nextActivity());
                continue;
            } catch (IllegalStateException ex) {
                // Looks like a course, so finalize.
            }
            break;
        }
        return new AbstractMap.SimpleImmutableEntry<>(String.format("%s %s", data[0], data[1]),
                courseBuilder.putSection(data[2], sectionBuilder.build()).build());
    }

    private Element next() {
        return this.cells.get(this.index++);
    }

    private String nextString() {
        return this.next().text().trim();
    }

    private Schedule nextSchedule() {
        return Schedule.parse(this.nextString().replaceAll("\\s+", ""));
    }

    private String nextNote() {
        if (!this.cells.get(this.index).attr("colspan").equals("24")) {
            throw new IllegalStateException("Not notes");
        }
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
            if (!token.isEmpty()) {
                builder.add(token);
            }
        }
        return builder.build();
    }

    private Activity nextActivity() {
        String check = this.nextString();
        this.index--;
        if (check.split("\\s[/-]\\s").length == 3) {
            throw new IllegalStateException("Not an activity");
        } else if (check.isEmpty()) {
            this.index += 3;
        }
        String[] instructors = this.nextString().split(";");
        Schedule schedule = this.nextSchedule();
        String sectionType = this.nextString();
        String activityId = this.nextString();
        String activityType = this.nextString();
        Enrollment enrollment = this.nextEnrollment();
        String location = this.nextString().replaceAll("\\s+-", "-");
        this.index += 3;
        if (activityType.isEmpty()) {
            return PrimaryActivity.builder()
                    .addAllInstructors(Arrays.asList(instructors))
                    .setSchedule(schedule)
                    .setType(sectionType)
                    .setLocation(location)
                    .build();
        } else {
            return SecondaryActivity.builder()
                    .setId(activityId)
                    .addAllInstructors(Arrays.asList(instructors))
                    .setSchedule(schedule)
                    .setType(activityType)
                    .setLocation(location)
                    .setEnrollment(enrollment)
                    .build();
        }
    }
}
