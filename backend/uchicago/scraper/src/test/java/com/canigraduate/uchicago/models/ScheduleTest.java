package com.canigraduate.uchicago.models;

import com.google.common.collect.ImmutableSet;
import com.google.common.collect.ImmutableSortedSet;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.stream.Stream;

import static java.time.DayOfWeek.*;
import static org.assertj.core.api.Assertions.assertThat;

public class ScheduleTest {
    static Stream<Arguments> data() {
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
        ImmutableSet.Builder<Schedule.Block> builder = new ImmutableSortedSet.Builder<>(Schedule.Block::compareTo);
        for (DayOfWeek day : days) {
            builder.add(Schedule.Block.create(day, LocalTime.parse(from), LocalTime.parse(to)));
        }
        return Schedule.create(builder.build());
    }

    @ParameterizedTest
    @MethodSource("data")
    public void parse(String input, Schedule expected) {
        assertThat(Schedule.parse(input)).isEqualTo(expected);
    }
}