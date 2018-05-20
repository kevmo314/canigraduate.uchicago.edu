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
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
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

    private static int bytesRequired(int value) {
        for (int i = 1; i <= 4; i++) {
            if ((value >> (8 * i)) == 0) {
                return i;
            }
        }
        throw new RuntimeException("wat");
    }

    private static byte[] pack(List<Integer> values) {
        // Figure out how many bits are required for each.
        int bits = values.stream().map(Indexer::bytesRequired).reduce(0, Math::max);
        ByteArrayOutputStream bos = new ByteArrayOutputStream(values.size() * bits + 1);
        DataOutputStream dos = new DataOutputStream(bos);
        try {
            dos.writeByte(bits);
            for (int value : values) {
                for (int i = 0; i < bits; i++, value >>= 8) {
                    dos.writeByte(value & 0xFF);
                }
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return bos.toByteArray();
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

    public static SortedMap<String, Course> getCourses() {
        Map<String, Course> courses = ImmutableMap.copyOf(new Courses().all());
        LOGGER.info(String.format("Found %d courses", courses.size()));
        // For some reason, sequences get added to the course sets. This is kind of odd, and I'm not sure where the bug
        // is, so just manually delete them...
        courses.keySet().stream().filter(key -> key.length() > 10).forEach(sequence -> {
            System.err.println("Deleting " + sequence);
            new Courses().delete(sequence);
        });
        return ImmutableSortedMap.copyOf(courses.keySet()
                .stream()
                .filter(key -> key.length() == 10)
                .collect(Collectors.toMap(Function.identity(), courses::get)));
    }

    public static void main(String[] args) throws Exception {
        ExecutorService service = Executors.newFixedThreadPool(256);
        LOGGER.info("Starting...");
        SortedMap<String, Course> courses = getCourses();
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
                            .stream().filter(term -> term.getYear() >= LocalDate.now().getYear() - 1)
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
                }
            });
            // Perform the deletions.
            List<String> deletions = deletionsBuilder.build();
            LOGGER.info(String.format("Deleting %d entries from Algolia.", deletions.size()));
            algoliaIndex.deleteObjects(deletions);
            // Then update to the desired state.
            LOGGER.info(String.format("Updating Algolia with %d entries.", desiredState.size()));
            algoliaIndex.saveObjects(ImmutableList.copyOf(desiredState.values()));
        }
        JsonObject index = new JsonObject();
        // Atomicity is a little more important for the indexes, so the indexes are in one giant file.
        {
            LOGGER.info("Building cardinality table.");
            HashMap<Integer, ArrayList<Integer>> mappings = new HashMap<>();
            Set<String> sectionIdsSet = new HashSet<>();
            for (int i = 0; i < courseKeys.length; i++) {
                for (int j = 0; j < termKeys.length; j++) {
                    Optional.ofNullable(sections.get(courseKeys[i], termKeys[j]))
                            .map(Map::keySet)
                            .ifPresent(sectionIdsSet::addAll);
                }
            }
            List<String> sectionIds = new ArrayList<>(sectionIdsSet);
            Collections.sort(sectionIds);
            ImmutableList.Builder<Integer> idsBuilder = new ImmutableList.Builder<>();
            for (int i = 0; i < courseKeys.length; i++) {
                for (int j = 0; j < termKeys.length; j++) {
                    int size = Optional.ofNullable(sections.get(courseKeys[i], termKeys[j])).map(Map::size).orElse(0);
                    if (size > 0) {
                        sections.get(courseKeys[i], termKeys[j])
                                .keySet()
                                .stream()
                                .map(id -> Collections.binarySearch(sectionIds, id))
                                .forEach(idsBuilder::add);
                        mappings.computeIfAbsent(size, ArrayList::new).add(i * termKeys.length + j);
                    }
                }
            }
            ImmutableList.Builder<Integer> builder = new ImmutableList.Builder<>();
            mappings.forEach((key, values) -> {
                builder.add(key);
                builder.add(values.size());
                builder.addAll(values);
            });
            JsonArray coursesJson = new JsonArray();
            Arrays.stream(courseKeys).forEach(coursesJson::add);
            JsonArray termsJson = new JsonArray();
            Arrays.stream(termKeys).map(Term::getTerm).forEach(termsJson::add);
            JsonArray sectionsJson = new JsonArray();
            sectionIds.forEach(sectionsJson::add);
            index.add("courses", coursesJson);
            index.add("terms", termsJson);
            index.add("sections", sectionsJson);
            index.addProperty("cardinalities", Base64.getEncoder().encodeToString(pack(builder.build())));
            index.addProperty("sectionIds", Base64.getEncoder().encodeToString(pack(idsBuilder.build())));
        }
        {
            LOGGER.info("Building department index.");
            JsonObject departmentsJson = new JsonObject();
            service.invokeAll(Arrays.stream(courseKeys)
                    .collect(Collectors.groupingBy(course -> course.substring(0, 4)))
                    .entrySet()
                    .stream()
                    .map(entry -> (Callable<Map.Entry<String, String>>) () -> new AbstractMap.SimpleEntry<>(
                            entry.getKey(), Base64.getEncoder()
                            .encodeToString(pack(entry.getValue()
                                    .stream()
                                    .map(matchedCourse -> Arrays.binarySearch(courseKeys, matchedCourse))
                                    .collect(Collectors.toList())))))
                    .collect(Collectors.toList())).stream().map(future -> {
                try {
                    return future.get();
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }).forEach(entry -> departmentsJson.addProperty(entry.getKey(), entry.getValue()));
            JsonObject metadata = new JsonObject();
            metadata.addProperty("dimension", "course");
            departmentsJson.add("_metadata", metadata);
            index.add("departments", departmentsJson);
        }
        {
            LOGGER.info("Building sequence index.");
            JsonObject sequencesJson = new JsonObject();
            courses.entrySet()
                    .stream()
                    .filter(entry -> entry.getValue().getParent().isPresent())
                    .collect(Collectors.groupingBy(entry -> entry.getValue().getParent().get()))
                    .forEach((sequence, entries) -> sequencesJson.addProperty(sequence, Base64.getEncoder()
                            .encodeToString(pack(entries.stream()
                                    .map(Map.Entry::getKey)
                                    .map(course -> Arrays.binarySearch(courseKeys, course))
                                    .collect(Collectors.toList())))));
            JsonObject metadata = new JsonObject();
            metadata.addProperty("dimension", "course");
            sequencesJson.add("_metadata", metadata);
            index.add("sequences", sequencesJson);
        }
        {
            LOGGER.info("Building age index.");
            JsonObject agesJson = new JsonObject();
            agesJson.addProperty("old", Base64.getEncoder()
                    .encodeToString(pack(keys.stream()
                            .filter(termKey -> termKey.getTerm().getAge() > 16)
                            .map(TermKey::getCourse)
                            .map(course -> Arrays.binarySearch(courseKeys, course))
                            .collect(Collectors.toList()))));
            JsonObject metadata = new JsonObject();
            metadata.addProperty("dimension", "course");
            agesJson.add("_metadata", metadata);
            index.add("ages", agesJson);
        }
        {
            LOGGER.info("Building period index.");
            JsonObject periodsJson = new JsonObject();
            Arrays.stream(termKeys).map(Term::getPeriod).distinct().sorted().forEach(period -> {
                ImmutableList.Builder<Integer> builder = new ImmutableList.Builder<>();
                for (int i = 0; i < termKeys.length; i++) {
                    if (termKeys[i].getPeriod().equals(period)) {
                        builder.add(i);
                    }
                }
                periodsJson.addProperty(period, Base64.getEncoder().encodeToString(pack(builder.build())));
            });
            JsonObject metadata = new JsonObject();
            metadata.addProperty("dimension", "term");
            periodsJson.add("_metadata", metadata);
            index.add("periods", periodsJson);
        }
        {
            LOGGER.info("Building year index.");
            JsonObject yearsJson = new JsonObject();
            Arrays.stream(termKeys).map(Term::getYear).distinct().sorted().forEach(year -> {
                ImmutableList.Builder<Integer> builder = new ImmutableList.Builder<>();
                for (int i = 0; i < termKeys.length; i++) {
                    if (termKeys[i].getYear() == year) {
                        builder.add(i);
                    }
                }
                yearsJson.addProperty(String.valueOf(year), Base64.getEncoder().encodeToString(pack(builder.build())));
            });
            JsonObject metadata = new JsonObject();
            metadata.addProperty("dimension", "term");
            yearsJson.add("_metadata", metadata);
            index.add("years", yearsJson);
        }
        {
            LOGGER.info("Building instructors index.");
            JsonObject instructorsJson = new JsonObject();
            Map<String, List<Integer>> instructors = new HashMap<>();
            AtomicInteger checksum = new AtomicInteger();
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
                                        .filter(instructor -> !instructor.isEmpty())
                                        .forEach(instructor -> instructors.computeIfAbsent(instructor,
                                                key -> new ArrayList<>()).add(checksum.get()));
                                checksum.getAndIncrement();
                            }));
                }
            }
            Preconditions.checkState(checksum.get() == totalCardinality, "Some sections were dropped maybe...");
            instructors.forEach((instructor, indexes) -> instructorsJson.addProperty(instructor,
                    Base64.getEncoder().encodeToString(pack(indexes))));
            JsonObject metadata = new JsonObject();
            metadata.addProperty("dimension", "section");
            instructorsJson.add("_metadata", metadata);
            index.add("instructors", instructorsJson);
        }
        {
            LOGGER.info("Building enrollment index.");
            JsonObject enrollmentsJson = new JsonObject();
            Map<String, List<Integer>> enrollments = new HashMap<>();
            AtomicInteger checksum = new AtomicInteger();
            for (String courseKey : courseKeys) {
                for (Term termKey : termKeys) {
                    Optional.ofNullable(sections.get(courseKey, termKey))
                            .ifPresent(map -> map.forEach((sectionId, section) -> {
                                if (section.getEnrollment().isFull()) {
                                    enrollments.computeIfAbsent("full", key -> new ArrayList<>()).add(checksum.get());
                                }
                                checksum.getAndIncrement();
                            }));
                }
            }
            Preconditions.checkState(checksum.get() == totalCardinality, "Some sections were dropped maybe...");
            enrollments.forEach((enrollment, sparse) -> enrollmentsJson.addProperty(enrollment,
                    Base64.getEncoder().encodeToString(pack(sparse))));
            JsonObject metadata = new JsonObject();
            metadata.addProperty("dimension", "section");
            enrollmentsJson.add("_metadata", metadata);
            index.add("enrollments", enrollmentsJson);
        }

        FirestoreService.writeIndex(index);

        service.shutdown();
    }

    static class AlgoliaCourse {
        private String name;
        private String objectID;
        private String description;

        AlgoliaCourse() {
        }

        public String getDescription() {
            return this.description;
        }

        public AlgoliaCourse setDescription(String description) {
            this.description = description;
            return this;
        }

        public String getName() {
            return this.name;
        }

        public AlgoliaCourse setName(String name) {
            this.name = name;
            return this;
        }

        public String getObjectID() {
            return this.objectID;
        }

        public AlgoliaCourse setObjectID(String objectID) {
            this.objectID = objectID;
            return this;
        }

        boolean equals(AlgoliaCourse that) {
            return Comparator.comparing(AlgoliaCourse::getDescription)
                    .thenComparing(AlgoliaCourse::getName)
                    .thenComparing(AlgoliaCourse::getObjectID)
                    .compare(this, that) == 0;
        }

        @Override
        public int hashCode() {
            return this.getDescription().hashCode() ^ this.getName().hashCode() ^ this.getObjectID().hashCode();
        }

        @Override
        public String toString() {
            return String.format("%s %s %s", this.getObjectID(), this.getName(), this.getDescription());
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
            return this.row;
        }

        @Override
        public Term getColumnKey() {
            return this.col;
        }

        @Override
        public SortedMap<String, Section> getValue() {
            return this.value;
        }
    }
}
