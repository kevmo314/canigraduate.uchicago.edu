package com.canigraduate.uchicago.models;

import com.google.common.collect.ImmutableSet;
import com.google.common.collect.ImmutableSortedSet;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.Parameterized;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Collection;

import static java.time.DayOfWeek.*;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(Parameterized.class)
public class ScheduleTest {
    private final String input;
    private final Schedule expected;

    public ScheduleTest(String input, Schedule expected) {
        this.input = input;
        this.expected = expected;
    }

    @Parameterized.Parameters
    public static Collection<Object[]> data() {
        Object[][] data = new Object[][]{{"ARRARR", Schedule.create(ImmutableSet.of())},
                {"MWF12:30PM-1:20PM", expect("12:30:00", "13:20:00", MONDAY, WEDNESDAY, FRIDAY)},
                {"TTh10:30AM-11:50AM", expect("10:30:00", "11:50:00", TUESDAY, THURSDAY)},
                {"Tue10:30AM-11:50AM", expect("10:30:00", "11:50:00", TUESDAY)},
                {"U10:30AM-11:50AM", expect("10:30:00", "11:50:00", TUESDAY)},
                {"M-F7:30AM-3:20PM", expect("07:30:00", "15:20:00", MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY)},
                {"Sat1:00PM-4:00PM", expect("13:00:00", "16:00:00", SATURDAY)},
                {"MWHF12:30PM-1:20PM", expect("12:30:00", "13:20:00", MONDAY, WEDNESDAY, THURSDAY, FRIDAY)},
                {"MWRF12:30PM-1:20PM", expect("12:30:00", "13:20:00", MONDAY, WEDNESDAY, THURSDAY, FRIDAY)},
                {"MWTHF12:30PM-1:20PM", expect("12:30:00", "13:20:00", MONDAY, WEDNESDAY, THURSDAY, FRIDAY)},
                {"Thu3:00PM-5:50PM", expect("15:00:00", "17:50:00", THURSDAY)},
                {"Mon Wed Fri : 09:30 AM-10:20 AM", expect("09:30:00", "10:20:00", MONDAY, WEDNESDAY, FRIDAY)}};
        return Arrays.asList(data);
    }

    private static Schedule expect(String from, String to, DayOfWeek... days) {
        ImmutableSet.Builder<Schedule.Block> builder = new ImmutableSortedSet.Builder<>(Schedule.Block::compareTo);
        for (DayOfWeek day : days) {
            builder.add(Schedule.Block.create(day, LocalTime.parse(from), LocalTime.parse(to)));
        }
        return Schedule.create(builder.build());
    }

    @Test
    public void test() {
        assertThat(Schedule.parse(this.input)).isEqualTo(this.expected);
    }
}