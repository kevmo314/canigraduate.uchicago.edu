# canigraduate.uchicago.edu

## Terminology

### Courses and scheduling

- `department` is a substring of course identifiers that represents the host department, for example, `MATH`.
- `id` is a fully-qualified course identifier that includes a department, for example, `MATH 15100`.
- `period` is a name of a course offering period, for example, `Winter`.
- `term` is a fully-qualified course offering period, for example, `Winter 2016`. Note that these are not referred to as semesters or quarters to avoid dependence on any temporal regularity. There is no guarantee that a university stays on a semester or quarter system.
- `course` is an individual course offering. A course is uniquely identified by its `id` and its term, for example, `MATH 15100` offered in `Autumn 2015`. Note that we explicitly choose to use `course` instead of `class` to avoid reserved word conflicts. Additionally, note that in some cases, a `Course` object may refer to a term-invariant course. This is done for convenience, as naming the object `Id` is less desirable.
- `section` is an identifier that represents the specific course selection within a quarter. This permits multiple sections of courses
  to be offered each term, for example, `MATH 15100` section `01` offered in `Autumn 2015`. Typically, different sections have different schedules,
  however this is not required.
- `activity` is an individual course attendance block, for example, `Lecture` or `Discussion`.
  - `primary` is a type of activity for which attendance to all primaries is required, for example, `Lecture`.
  - `secondary` is a type of activity for which attendance to only one secondary is selected, for example, `Lab`.
- `crosslist` is a list of `id`s that are equivalent.

### Grades and transcripts

- `quality` is whether or not the course counts towards the student's calculated gpa.

## Data specifications

Institutions must meet certain requirements in order to be represented on __Can I Graduate?__. These requirements are listed below.

### Course identifiers

In order to use wildcard matching, course identifiers must have an ordinal representation. Otherwise, only exact matching is possible.

### Departments

Departments must have one unique identifier.

### Crosslistings

Course crosslistings must be valid equivalence classes. Missing or incomplete crosslisting information can produce unexpected behavior.
