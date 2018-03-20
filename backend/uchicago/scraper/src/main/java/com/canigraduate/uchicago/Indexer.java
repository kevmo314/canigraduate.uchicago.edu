package com.canigraduate.uchicago;

import com.algolia.search.APIClient;
import com.algolia.search.ApacheAPIClientBuilder;
import com.algolia.search.Index;
import com.algolia.search.objects.Query;
import com.canigraduate.uchicago.firestore.Courses;
import com.canigraduate.uchicago.firestore.FirestoreService;
import com.canigraduate.uchicago.firestore.Sections;
import com.canigraduate.uchicago.firestore.Terms;
import com.canigraduate.uchicago.models.*;
import com.canigraduate.uchicago.pipeline.models.TermKey;
import com.google.common.base.Preconditions;
import com.google.common.collect.*;
import com.google.common.primitives.Chars;
import com.google.gson.JsonArray;

import java.io.InputStream;
import java.time.YearMonth;
import java.util.*;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.logging.Logger;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class Indexer {
    private static final Logger LOGGER = Logger.getLogger(Indexer.class.getName());

    private static String pack(List<Integer> values) {
        char[] bytes = new char[values.size() * 2];
        int i = 0;
        for (int value : values) {
            bytes[i++] = Chars.checkedCast((value & 0xFFFF0000) >> 16);
            bytes[i++] = Chars.checkedCast((value & 0x0000FFFF));
        }
        return new String(bytes);
    }

    private static int totalCardinality(Table<String, Term, SortedMap<String, Section>> sections) {
        return sections.rowKeySet()
                .stream()
                .map(sections::row)
                .map(Map::values)
                .flatMap(Collection::stream)
                .mapToInt(Map::size)
                .sum();
    }

    public static void main(String[] args) throws Exception {
        ExecutorService service = Executors.newFixedThreadPool(256);
        LOGGER.info("Starting...");
        SortedMap<String, Course> courses = ImmutableSortedMap.copyOf(new Courses().all());
        LOGGER.info(String.format("Found %d courses", courses.size()));
        List<TermKey> keys = service.invokeAll(courses.keySet()
                .stream()
                .map(course -> (Callable<List<TermKey>>) () -> Streams.stream(new Terms(course).list())
                        .map(term -> TermKey.builder().setCourse(course).setTerm(Term.create(term)).build())
                        .collect(Collectors.toList()))
                .collect(Collectors.toList())).stream().flatMap(future -> {
            try {
                return future.get().stream();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }).collect(Collectors.toList());
        SortedSet<Term> terms = keys.stream()
                .map(TermKey::getTerm)
                .distinct()
                .collect(ImmutableSortedSet.toImmutableSortedSet(Term::compareTo));
        LOGGER.info(String.format("Found %d terms, %d term keys", terms.size(), keys.size()));
        Table<String, Term, SortedMap<String, Section>> sections = service.invokeAll(keys.stream()
                .map(termKey -> (Callable<Cell>) () -> new Cell(termKey.getCourse(), termKey.getTerm(),
                        ImmutableSortedMap.copyOf(
                                new Sections(termKey.getCourse(), termKey.getTerm().getTerm()).all())))
                .collect(Collectors.toList())).stream().map(future -> {
            try {
                return future.get();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }).collect(ImmutableTable.toImmutableTable(Cell::getRowKey, Cell::getColumnKey, Cell::getValue));
        int totalCardinality = totalCardinality(sections);
        LOGGER.info(String.format("Found %d total cardinality", totalCardinality));
        String[] courseKeys = courses.keySet().toArray(new String[]{});
        Term[] termKeys = terms.toArray(new Term[]{});

        {
            Properties algoliaConfig = new Properties();
            try (InputStream in = Indexer.class.getResourceAsStream("algolia.properties")) {
                algoliaConfig.load(in);
            }
            APIClient algolia = new ApacheAPIClientBuilder(algoliaConfig.getProperty("application_id"),
                    algoliaConfig.getProperty("admin_api_key")).build();
            Index<AlgoliaCourse> algoliaIndex = algolia.initIndex("uchicago", AlgoliaCourse.class);
            // Update the Algolia full-text index.
            Map<String, AlgoliaCourse> desiredState = courses.entrySet()
                    .stream()
                    // Only include courses offered within the last year, otherwise we'll never meet Algolia's quotas.
                    .filter(entry -> sections.row(entry.getKey())
                            .keySet()
                            .stream()
                            .filter(term -> term.getYear() >= YearMonth.now().getYear() - 1)
                            .iterator()
                            .hasNext())
                    .filter(entry -> entry.getValue().getDescription().isPresent())
                    .map(entry -> new AlgoliaCourse().setDescription(entry.getValue().getDescription().get())
                            .setName(entry.getValue().getName())
                            .setObjectID(entry.getKey()))
                    // Must be at least longer than a tweet. lol.
                    .filter(course -> !course.getDescription().equals("No description available."))
                    .collect(Collectors.toMap(AlgoliaCourse::getObjectID, Function.identity()));
            ImmutableList.Builder<String> deletionsBuilder = new ImmutableList.Builder<>();
            algoliaIndex.browse(new Query()).forEach(course -> {
                String key = course.getObjectID();
                AlgoliaCourse reference = desiredState.get(key);
                if (reference == null) {
                    // This course should be deleted.
                    deletionsBuilder.add(key);
                } else if (reference.equals(course)) {
                    // The two states are equal so remove the state to prevent it from being updated.
                    desiredState.remove(key);
                } else {
                    System.out.println("Need to update: " + reference + " " + course);
                }
            });
            // Perform the deletions.
            List<String> deletions = deletionsBuilder.build();
            LOGGER.info(String.format("Deleting %d entries from Algolia.", deletions.size()));
            algoliaIndex.deleteObjects(deletions);
            // Then update to the desired state.
            LOGGER.info(String.format("Updating Algolia with %d entries.", desiredState.size()));
            algoliaIndex.saveObjects(ImmutableList.copyOf(desiredState.values()));
            System.exit(0);
        }
        {
            // Build the cardinality table.
            ImmutableList.Builder<Integer> builder = new ImmutableList.Builder<>();
            for (int i = 0; i < courseKeys.length; i++) {
                for (int j = 0; j < termKeys.length; j++) {
                    int size = Optional.ofNullable(sections.get(courseKeys[i], termKeys[j])).map(Map::size).orElse(0);
                    if (size > 0) {
                        builder.add(i * termKeys.length + j);
                        builder.add(size);
                    }
                }
            }
            JsonArray coursesJson = new JsonArray();
            courses.keySet().forEach(coursesJson::add);
            JsonArray termsJson = new JsonArray();
            terms.stream().map(Term::getTerm).forEach(termsJson::add);
            FirestoreService.writeIndex("cardinalities/cardinality.bin", pack(builder.build()));
            FirestoreService.writeIndex("cardinalities/courses.json", coursesJson.toString());
            FirestoreService.writeIndex("cardinalities/terms.json", termsJson.toString());
        }
        {
            // Build the department index.
            service.invokeAll(Arrays.stream(courseKeys)
                    .collect(Collectors.groupingBy(course -> course.substring(0, 4)))
                    .entrySet()
                    .stream()
                    .map(entry -> (Callable<Void>) () -> {
                        String department = entry.getKey();
                        List<String> matchedCourses = entry.getValue();
                        FirestoreService.writeIndex("departments/" + department + ".course.sparse.bin",
                                pack(matchedCourses.stream()
                                        .map(matchedCourse -> Arrays.binarySearch(courseKeys, matchedCourse))
                                        .collect(Collectors.toList())));
                        return null;
                    })
                    .collect(Collectors.toList()));
        }
        {
            // Build the period index.
            Arrays.stream(termKeys).map(Term::getPeriod).distinct().forEach(period -> {
                BitSet dense = new BitSet(courseKeys.length * termKeys.length);
                for (int i = 0; i < courseKeys.length; i++) {
                    for (int j = 0; j < termKeys.length; j++) {
                        if (!termKeys[j].getPeriod().equals(period)) {
                            continue;
                        }
                        dense.set(i * termKeys.length + j, Optional.ofNullable(sections.get(courseKeys[i], termKeys[j]))
                                .map(Map::size)
                                .orElse(0) > 0);
                    }
                }
                FirestoreService.writeIndex("periods/" + period + ".term.dense.bin", new String(dense.toByteArray()));
            });
        }
        {
            // Build the year index.
            Arrays.stream(termKeys).map(Term::getYear).distinct().forEach(year -> {
                BitSet dense = new BitSet(courseKeys.length * termKeys.length);
                for (int i = 0; i < courseKeys.length; i++) {
                    for (int j = 0; j < termKeys.length; j++) {
                        if (termKeys[j].getYear() != year) {
                            continue;
                        }
                        dense.set(i * termKeys.length + j, Optional.ofNullable(sections.get(courseKeys[i], termKeys[j]))
                                .map(Map::size)
                                .orElse(0) > 0);
                    }
                }
                FirestoreService.writeIndex("years/" + year + ".term.dense.bin", new String(dense.toByteArray()));
            });
        }
        {
            // Build the instructors index.
            Map<String, List<Integer>> instructors = new HashMap<>();
            AtomicInteger index = new AtomicInteger();
            for (String courseKey : courseKeys) {
                for (Term termKey : termKeys) {
                    Optional.ofNullable(sections.get(courseKey, termKey))
                            .ifPresent(map -> map.forEach((sectionId, section) -> {
                                Stream.concat(section.getPrimaryActivities()
                                        .stream()
                                        .map(PrimaryActivity::getInstructors)
                                        .flatMap(Collection::stream), section.getSecondaryActivities()
                                        .stream()
                                        .map(SecondaryActivity::getInstructors)
                                        .flatMap(Collection::stream))
                                        .distinct()
                                        .forEach(instructor -> instructors.computeIfAbsent(instructor,
                                                key -> new ArrayList<>()).add(index.get()));
                                index.getAndIncrement();
                            }));
                }
            }
            Preconditions.checkState(index.get() == totalCardinality, "Some sections were dropped maybe...");
            service.invokeAll(instructors.entrySet().stream().map(entry -> (Callable<Void>) () -> {
                FirestoreService.writeIndex("instructors/" + entry.getKey() + ".section.sparse.bin",
                        pack(entry.getValue()));
                return null;
            }).collect(Collectors.toList()));
        }
        {
            // Build the enrollment index.
            Map<String, List<Integer>> enrollments = new HashMap<>();
            AtomicInteger index = new AtomicInteger();
            for (String courseKey : courseKeys) {
                for (Term termKey : termKeys) {
                    Optional.ofNullable(sections.get(courseKey, termKey))
                            .ifPresent(map -> map.forEach((sectionId, section) -> {
                                if (section.getEnrollment().isFull()) {
                                    enrollments.computeIfAbsent("full", key -> new ArrayList<>()).add(index.get());
                                }
                                index.getAndIncrement();
                            }));
                }
            }
            Preconditions.checkState(index.get() == totalCardinality, "Some sections were dropped maybe...");
            enrollments.forEach((enrollment, sparse) -> FirestoreService.writeIndex(
                    "enrollments/" + enrollment + ".section.sparse.bin", pack(sparse)));
        }

        service.shutdown();
    }

    static class AlgoliaCourse {
        private String name;
        private String objectID;
        private String description;

        AlgoliaCourse() {
        }

        String getDescription() {
            return description;
        }

        AlgoliaCourse setDescription(String description) {
            this.description = description;
            return this;
        }

        String getName() {
            return name;
        }

        AlgoliaCourse setName(String name) {
            this.name = name;
            return this;
        }

        String getObjectID() {
            return objectID;
        }

        AlgoliaCourse setObjectID(String objectID) {
            this.objectID = objectID;
            return this;
        }

        boolean equals(AlgoliaCourse that) {
            return Comparator.comparing(AlgoliaCourse::getDescription)
                    .thenComparing(AlgoliaCourse::getName)
                    .thenComparing(AlgoliaCourse::getObjectID)
                    .compare(this, that) == 0;
        }

        public int hashCode() {
            return getDescription().hashCode() ^ getName().hashCode() ^ getObjectID().hashCode();
        }

        public String toString() {
            return String.format("%s %s %s", getObjectID(), getName(), getDescription());
        }
    }

    static class Cell implements Table.Cell<String, Term, SortedMap<String, Section>> {
        private final SortedMap<String, Section> value;
        private final String row;
        private final Term col;

        Cell(String row, Term col, SortedMap<String, Section> value) {
            this.row = row;
            this.col = col;
            this.value = value;
        }

        @Override
        public String getRowKey() {
            return row;
        }

        @Override
        public Term getColumnKey() {
            return col;
        }

        @Override
        public SortedMap<String, Section> getValue() {
            return value;
        }
    }
}
