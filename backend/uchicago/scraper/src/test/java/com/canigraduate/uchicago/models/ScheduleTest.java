package com.canigraduate.uchicago.models;

import com.google.common.collect.ImmutableSet;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.stream.Stream;

import static java.time.DayOfWeek.*;
import static org.assertj.core.api.Assertions.assertThat;

class ScheduleTest {
    private static Stream<Arguments> data() {
        return Stream.of(Arguments.of("ARRARR", Schedule.create(ImmutableSet.of())),
                Arguments.of("MWF12:30PM-1:20PM", expect("12:30:00", "13:20:00", MONDAY, WEDNESDAY, FRIDAY)),
                Arguments.of("TTh10:30AM-11:50AM", expect("10:30:00", "11:50:00", TUESDAY, THURSDAY)),
                Arguments.of("Tue10:30AM-11:50AM", expect("10:30:00", "11:50:00", TUESDAY)),
                Arguments.of("U10:30AM-11:50AM", expect("10:30:00", "11:50:00", TUESDAY)),
                Arguments.of("M-F7:30AM-3:20PM",
                        expect("07:30:00", "15:20:00", MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY)),
                Arguments.of("Sat1:00PM-4:00PM", expect("13:00:00", "16:00:00", SATURDAY)),
                Arguments.of("MWHF12:30PM-1:20PM", expect("12:30:00", "13:20:00", MONDAY, WEDNESDAY, THURSDAY, FRIDAY)),
                Arguments.of("MWRF12:30PM-1:20PM", expect("12:30:00", "13:20:00", MONDAY, WEDNESDAY, THURSDAY, FRIDAY)),
                Arguments.of("MWTHF12:30PM-1:20PM",
                        expect("12:30:00", "13:20:00", MONDAY, WEDNESDAY, THURSDAY, FRIDAY)),
                Arguments.of("Thu3:00PM-5:50PM", expect("15:00:00", "17:50:00", THURSDAY)),
                Arguments.of("Mon Wed Fri : 09:30 AM-10:20 AM",
                        expect("09:30:00", "10:20:00", MONDAY, WEDNESDAY, FRIDAY)));
    }

    private static Schedule expect(String from, String to, DayOfWeek... days) {
        ImmutableSet.Builder<Schedule.Block> builder = new ImmutableSet.Builder<>();
        for (DayOfWeek day : days) {
            builder.add(Schedule.Block.create(day, LocalTime.parse(from), LocalTime.parse(to)));
        }
        return Schedule.create(builder.build());
    }

    @ParameterizedTest
    @MethodSource("data")
    void parse(String input, Schedule expected) {
        assertThat(Schedule.parse(input)).isEqualTo(expected);
    }

    @Test
    void parse_multiple() {
        assertThat(Schedule.parse("Mon Wed Fri : 01:30 PM-05:30 PM & Tue Thu : 01:00 PM-03:00 PM")).isEqualTo(
                Schedule.create(new ImmutableSet.Builder<Schedule.Block>().add(
                        Schedule.Block.create(MONDAY, LocalTime.parse("13:30:00"), LocalTime.parse("17:30:00")))
                        .add(Schedule.Block.create(WEDNESDAY, LocalTime.parse("13:30:00"), LocalTime.parse("17:30:00")))
                        .add(Schedule.Block.create(FRIDAY, LocalTime.parse("13:30:00"), LocalTime.parse("17:30:00")))
                        .add(Schedule.Block.create(TUESDAY, LocalTime.parse("13:00:00"), LocalTime.parse("15:00:00")))
                        .add(Schedule.Block.create(THURSDAY, LocalTime.parse("13:00:00"), LocalTime.parse("15:00:00")))
                        .build()));
    }
}