package com.canigraduate.uchicago.models;

import com.google.auto.value.AutoValue;
import com.google.common.collect.ComparisonChain;
import com.google.common.collect.ImmutableSet;
import com.google.common.collect.ImmutableSortedSet;
import com.google.common.primitives.Ints;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@AutoValue
public abstract class Schedule {
    private static final Pattern PATTERN = Pattern.compile("([^:]+?):?(\\d[\\d: APM]+)-(\\d[\\d: APM]+)");
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("h:ma");
    private static final String[][] SEARCH_SPACE = new String[][]{{"sun"},
            {"mon"},
            {"u", "tue"},
            {"wed"},
            {"h", "r", "thu"},
            {"fri"},
            {"sat"}};

    public static Schedule parse(String s) {
        if (s.contains("&") || s.contains(",") || s.contains(";")) {
            return Arrays.stream(s.split("[&,;]"))
                    .map(Schedule::parse)
                    .reduce(Schedule.create(ImmutableSet.of()), Schedule::create);
        }
        if (s.contains("ARR") || s.contains("TBA") || s.contains(": -") || s.isEmpty()) {
            return new AutoValue_Schedule(ImmutableSet.of());
        }
        Matcher tokens = PATTERN.matcher(s.replaceAll("\\s", ""));
        if (!tokens.matches()) {
            throw new IllegalArgumentException("Regex didn't match: " + s);
        }
        String days = tokens.group(1);
        if (days.equals("M-F")) {
            days = "MTWThF";
        }
        LocalTime from = LocalTime.parse(tokens.group(2), FORMATTER);
        LocalTime to = LocalTime.parse(tokens.group(3), FORMATTER);
        return dfs(days.toLowerCase(), from, to, 0, 0).map(ImmutableSet.Builder::build)
                .map(AutoValue_Schedule::new)
                .orElseThrow(() -> new IllegalArgumentException("Could not parse " + s));
    }

    private static Optional<ImmutableSet.Builder<Block>> dfs(String days, LocalTime from, LocalTime to, int offset,
                                                             int index) {
        if (offset == SEARCH_SPACE.length) {
            return Optional.ofNullable(
                    index == days.length() ? new ImmutableSortedSet.Builder<>(Block::compareTo) : null);
        }
        for (String search : SEARCH_SPACE[offset]) {
            for (int j = 1; j <= Math.min(days.length() - index, search.length()); j++) {
                if (days.substring(index, index + j).equals(search.substring(0, j))) {
                    Optional<ImmutableSet.Builder<Block>> result = dfs(days, from, to, offset + 1, index + j);
                    if (result.isPresent()) {
                        return result.map(set -> {
                            DayOfWeek dayOfWeek = DayOfWeek.of(Math.floorMod(offset - 1, SEARCH_SPACE.length) + 1);
                            return set.add(Block.create(dayOfWeek, from, to));
                        });
                    }
                }
            }
        }
        return dfs(days, from, to, offset + 1, index);
    }

    private static Schedule create(Schedule a, Schedule b) {
        return new AutoValue_Schedule(
                new ImmutableSet.Builder<Schedule.Block>().addAll(a.getBlocks()).addAll(b.getBlocks()).build());
    }

    public static Schedule create(ImmutableSet<Block> newBlocks) {
        return new AutoValue_Schedule(newBlocks);
    }

    public abstract ImmutableSet<Block> getBlocks();

    @AutoValue
    public static abstract class Block {
        private static final long SECONDS_PER_DAY = Duration.ofDays(1).getSeconds();

        public static Block create(DayOfWeek newDay, LocalTime newFrom, LocalTime newTo) {
            return new AutoValue_Schedule_Block(newDay, newFrom, newTo);
        }

        public static Block fromLong(long value) {
            long to = value % SECONDS_PER_DAY;
            value /= SECONDS_PER_DAY;
            long from = value % SECONDS_PER_DAY;
            value /= SECONDS_PER_DAY;
            return Block.create(DayOfWeek.of(Ints.checkedCast(value)), LocalTime.ofSecondOfDay(from),
                    LocalTime.ofSecondOfDay(to));
        }

        public abstract DayOfWeek getDay();

        public abstract LocalTime getFrom();

        public abstract LocalTime getTo();

        public long toLong() {
            long from = this.getFrom().toSecondOfDay();
            long to = this.getTo().toSecondOfDay();
            return ((this.getDay().getValue() * SECONDS_PER_DAY) + from) * SECONDS_PER_DAY + to;
        }

        int compareTo(Block that) {
            return ComparisonChain.start()
                    .compare(this.getDay(), that.getDay())
                    .compare(this.getFrom(), that.getFrom())
                    .compare(this.getTo(), that.getTo())
                    .result();
        }
    }
}
