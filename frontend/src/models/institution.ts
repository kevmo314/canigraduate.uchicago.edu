import {
  DocumentReference,
  DocumentData,
  DocumentSnapshot,
} from '@firebase/firestore-types';
import { defer, of, combineLatest, Observable } from 'rxjs';
import { map, publishReplay, refCount, switchMap, tap } from 'rxjs/operators';
import firestore from './firestore';
import publishDocument from './publishDocument';
import Grades from './grades';
import TypedFastBitSet from 'fastbitset';
import Course from './course';
import Sequence from './sequence';
import Axios from 'axios';
import Indexes from './indexes';
import { HOST } from './functions';
import Watch from './watch';
import Program from './program';
import * as algoliasearch from 'algoliasearch';
import publishIndex from './publishIndex';
import binarySearch from '../lib/binary-search';

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
}

export default class Institution {
  private readonly ref: DocumentReference;
  private readonly gradeDistribution: Observable<{ [gpa: number]: number }>;
  private readonly indexes: Observable<Indexes>;
  private readonly algolia: Observable<algoliasearch.Index>;
  private readonly courseRanking: Observable<{ [course: string]: number }>;
  constructor(ref: DocumentReference) {
    this.ref = ref;
    this.gradeDistribution = defer(() => Axios.get(HOST + '/api/grades')).pipe(
      map(
        (response: { data: any }) =>
          Object.freeze(response.data) as { [gpa: number]: number },
      ),
      publishReplay(1),
      refCount(),
    );
    this.indexes = this.data().pipe(
      switchMap((institution: InstitutionData) => {
        return Axios.get(institution.indexesUrl);
      }),
      map(response => new Indexes(response.data)),
      publishReplay(1),
      refCount(),
    );
    this.algolia = combineLatest(
      defer(() => {
        return of(
          // Not sure why this is necessary...
          algoliasearch.default(
            'BF6BT6JP9W',
            '52677be23c182ca96eb2ccfd7c9c459f',
          ) as algoliasearch.Client,
        );
      }),
      this.data(),
    ).pipe(
      map(([algolia, institution]) =>
        algolia.initIndex(institution.algoliaIndex),
      ),
      publishReplay(1),
      refCount(),
    );
    this.courseRanking = combineLatest(
      this.getGradeDistribution().pipe(
        map(distribution => {
          return Object.entries(distribution).reduce((obj, [course, data]) => {
            return {
              ...obj,
              [course]: 2 * Object.values(data).reduce((a, b) => a + b),
            };
          }, {});
        }),
      ),
      this.getIndexes(),
      (courseRanking, indexes) => {
        Object.values(indexes.sequences).forEach(sequence => {
          // Promote the rank of each course in the sequence to the max.
          const max =
            sequence
              .map(course => courseRanking[course] | 0)
              .reduce((a, b) => Math.max(a, b)) + 1;
          sequence.forEach(course => (courseRanking[course] = max));
        });
        return courseRanking;
      },
    ).pipe(publishReplay(1), refCount());
  }

  data(): Observable<InstitutionData> {
    return publishDocument(this.ref) as Observable<InstitutionData>;
  }

  course(id: string) {
    return new Course(this, this.ref.collection('courses').doc(id));
  }

  sequence(id: string) {
    return new Sequence(this.ref.collection('sequences').doc(id));
  }

  get sequences(): Observable<string[]> {
    return publishIndex(this.ref.collection('sequences'));
  }

  program(id: string) {
    return new Program(
      this,
      this.ref.collection('programs').doc(id),
      this.ref.collection('subprograms'),
    );
  }

  get programs(): Observable<string[]> {
    return publishIndex(this.ref.collection('programs'));
  }

  getGradeDistribution(): Observable<Distribution> {
    return this.gradeDistribution;
  }

  getIndexes(): Observable<Indexes> {
    return this.indexes;
  }

  watch(id: string) {
    return new Watch(this.ref.collection('watches').doc(id));
  }

  getCourseRanking(): Observable<any> {
    return this.courseRanking;
  }

  search(filter$: Observable<FilterState>) {
    return combineLatest(filter$, this.getIndexes()).pipe(
      switchMap(([filter, indexes]) => {
        function filterAny(values, getter) {
          if (values.length == 0) {
            return results => new TypedFastBitSet();
          }
          const mask = values
            .map(x => getter(x))
            .reduce((a, b) => a.union(b), new TypedFastBitSet());
          return results => results.intersection(mask);
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
                }),
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
            ),
          );
        }
        if (filter.departments.length) {
          subsetters.push(
            of(filterAny(filter.departments, x => indexes.department(x))),
          );
        }
        if (filter.instructors.length) {
          subsetters.push(
            of(filterAny(filter.instructors, x => indexes.instructor(x))),
          );
        }
        subsetters.push(
          of(filterAny(filter.periods, x => indexes.periodIndex(x))),
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

        // Generate the subsetters.
        return combineLatest(subsetters).pipe(
          map(s => s.reduce((state, f) => f(state), state)),
          map(data => {
            console.log(data);
            let lowerBound = 0;
            const courses = [];
            data.forEach(index => {
              if (index < lowerBound) {
                return;
              }
              const courseOffsets = indexes.getCourseOffsets();
              const location = binarySearch(courseOffsets, index);
              const courseIndex = location < 0 ? ~location - 1 : location + 1;
              courses.push(indexes.getCourses()[courseIndex]);
              lowerBound = courseOffsets[courseIndex];
            });
            return { courses, serialized: data };
          }),
        );
      }),
    );
  }
}
