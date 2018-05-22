import { DocumentReference } from "@firebase/firestore-types";
import * as algoliasearch from "algoliasearch";
import Axios from "axios";
import TypedFastBitSet from "fastbitset";
import { Observable, combineLatest, defer, of } from "rxjs";
import {
  first,
  map,
  mergeAll,
  publishReplay,
  reduce,
  refCount,
  switchMap
} from "rxjs/operators";
import Course from "./course";
import { auth } from "./firebase";
import { HOST } from "./functions";
import Indexes from "./indexes";
import Program from "./program";
import publishDocument from "./publishDocument";
import publishIndex from "./publishIndex";
import Sequence from "./sequence";
import Watch from "./watch";

interface Period {
  readonly name: string;
  readonly shorthand: string;
  readonly color: string;
}

export interface InstitutionData {
  readonly algoliaIndex: string;
  readonly name: string;
  readonly gpas: number[];
  readonly periods: Period[];
  // Other properties that really don't matter because we don't compile vue templates in ts yet.
  readonly indexesUrl: string;
}

interface FilterState {
  query: string;
  periods: number[];
  days: any;
  departments: string[];
  instructors: string[];
  full: boolean;
  taken: boolean;
  old: boolean;
}

export default class Institution {
  private readonly ref: DocumentReference;
  private readonly gradeDistribution: Observable<{ [gpa: number]: number }>;
  private readonly indexes: Observable<Indexes>;
  private readonly algolia: Observable<algoliasearch.Index>;
  private readonly courseRanking: Observable<{ [course: string]: number }>;
  constructor(ref: DocumentReference) {
    this.ref = ref;
    this.gradeDistribution = defer(() => Axios.get(HOST + "/api/grades")).pipe(
      map(
        (response: { data: any }) =>
          Object.freeze(response.data) as { [gpa: number]: number }
      ),
      publishReplay(1),
      refCount()
    );
    this.indexes = this.data().pipe(
      switchMap((institution: InstitutionData) => {
        return Axios.get(institution.indexesUrl);
      }),
      map(response => new Indexes(response.data)),
      publishReplay(1),
      refCount()
    );
    this.algolia = combineLatest(
      defer(() => {
        return of(
          // Not sure why this is necessary...
          algoliasearch.default(
            "BF6BT6JP9W",
            "52677be23c182ca96eb2ccfd7c9c459f"
          ) as algoliasearch.Client
        );
      }),
      this.data()
    ).pipe(
      map(([algolia, institution]) =>
        algolia.initIndex(institution.algoliaIndex)
      ),
      publishReplay(1),
      refCount()
    );
    this.courseRanking = combineLatest(
      this.getGradeDistribution().pipe(
        map(distribution => {
          return Object.entries(distribution).reduce((obj, [course, data]) => {
            return {
              ...obj,
              [course]: 2 * Object.values(data).reduce((a, b) => a + b, 0)
            };
          }, {});
        })
      ),
      this.getIndexes(),
      (courseRanking, indexes) => {
        indexes
          .getSequences()
          .map(sequence => indexes.getSparseSequence(sequence))
          .forEach(sequence => {
            // Promote the rank of each course in the sequence to the max.
            const max =
              sequence
                .map(course => courseRanking[course] | 0)
                .reduce((a, b) => Math.max(a, b)) + 1;
            sequence.forEach(course => (courseRanking[course] = max));
          });
        return courseRanking;
      }
    ).pipe(publishReplay(1), refCount());
  }

  data(): Observable<InstitutionData> {
    return publishDocument(this.ref) as Observable<InstitutionData>;
  }

  course(id: string) {
    return new Course(this, this.ref.collection("courses").doc(id));
  }

  sequence(id: string) {
    return new Sequence(this.ref.collection("sequences").doc(id));
  }

  get sequences(): Observable<string[]> {
    return publishIndex(this.ref.collection("sequences"));
  }

  program(id: string) {
    return new Program(
      this,
      this.ref.collection("programs").doc(id),
      this.ref.collection("subprograms")
    );
  }

  get programs(): Observable<string[]> {
    return publishIndex(this.ref.collection("programs"));
  }

  getGradeDistribution(): Observable<Distribution> {
    return this.gradeDistribution;
  }

  getIndexes(): Observable<Indexes> {
    return this.indexes;
  }

  watch(id: string) {
    return new Watch(this.ref.collection("watches").doc(id));
  }

  getCourseRanking(): Observable<any> {
    return this.courseRanking;
  }

  getTranscript(username: string, password: string): Promise<any> {
    return Axios.get(HOST + "/api/transcript", {
      auth: { username, password }
    }).then(response => {
      return auth.signInWithCustomToken(response.data.token).then(() => {
        response.data.data = auth.currentUser;
        return response;
      });
    });
  }

  search(transcript: { course: string }[], filter: FilterState) {
    return combineLatest(this.getIndexes(), this.data()).pipe(
      switchMap(([indexes, institution]) => {
        function filterAny(values, getter) {
          return of(...values).pipe(
            map(x => getter(x)),
            reduce((a, b) => a.union(b), new TypedFastBitSet()),
            map(mask => results => results.intersection(mask))
          );
        }

        const subsetters = [];
        if (filter.query && filter.query.length > 0) {
          subsetters.push(
            this.algolia.pipe(
              switchMap(index =>
                index.search({
                  query: filter.query,
                  attributesToRetrieve: [],
                  attributesToHighlight: [],
                  allowTyposOnNumericTokens: false,
                  hitsPerPage: 1000
                })
              ),
              map(results => results.hits.map(result => result.objectID)),
              // Map the list of course identifiers to the corresponding bitset.
              map(courses => indexes.getBitSetForCourses(courses)),
              // Apply the exact query match mask.
              map(mask => {
                const course = filter.query.toUpperCase();
                return indexes.getCourses().includes(course)
                  ? mask.union(indexes.getBitSetForCourses([course]))
                  : mask;
              }),
              map(mask => results => results.intersection(mask)),
              first() // Complete the observable.
            )
          );
        }

        if (!filter.full) {
          subsetters.push(
            defer(() => of(indexes.enrollment("full"))).pipe(
              map(mask => results => results.difference(mask))
            )
          );
        }

        if (!filter.taken) {
          subsetters.push(
            of(transcript.map(record => record.course)).pipe(
              map(courses => indexes.getBitSetForCourses(courses)),
              map(mask => results => results.difference(mask))
            )
          );
        }

        if (!filter.old) {
          subsetters.push(
            defer(() => of(indexes.getTerms())).pipe(
              map(terms => terms.slice(0, terms.length - 16)),
              map(terms => indexes.getBitSetForTerms(terms)),
              map(mask => results => results.difference(mask))
            )
          );
        }

        if (filter.departments.length) {
          subsetters.push(
            filterAny(filter.departments, x => indexes.department(x))
          );
        }
        if (filter.instructors.length) {
          subsetters.push(
            filterAny(filter.instructors, x => indexes.instructor(x))
          );
        }
        subsetters.push(
          filterAny(
            filter.periods.filter(x => x < institution.periods.length),
            x => indexes.period(institution.periods[x].name)
          )
        );

        // This is a rather expensive filter...
        if (filter.days) {
        }

        // Generate a full state.
        const state = new TypedFastBitSet();
        state.resize(indexes.getTotalCardinality());
        for (let i = 0; i < indexes.getTotalCardinality(); i++) {
          state.add(i);
        }

        return combineLatest(...subsetters).pipe(
          mergeAll(),
          reduce((state, f) => f(state), state),
          map(data => indexes.getCourseTermSections(data))
        );
      })
    );
  }
}
