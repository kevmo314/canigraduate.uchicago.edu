import {
  DocumentReference,
  DocumentData,
  DocumentSnapshot,
} from '@firebase/firestore-types';
import { defer, of, combineLatest, Observable } from 'rxjs';
import {
  map,
  flatMap,
  publishReplay,
  refCount,
  switchMap,
  tap,
} from 'rxjs/operators';
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
import algoliasearch from 'algoliasearch';
import publishIndex from './publishIndex';

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

interface Distribution {
  [gpa: number]: number;
}

export default class Institution {
  private readonly ref: DocumentReference;
  private readonly gradeDistribution: Observable<Distribution>;
  private readonly indexes: Observable<Indexes>;
  private readonly algolia: Observable<any>;
  constructor(ref: DocumentReference) {
    this.ref = ref;
    this.gradeDistribution = defer(() => Axios.get(HOST + '/api/grades')).pipe(
      map(
        (response: { data: any }) =>
          Object.freeze(response.data) as Distribution,
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
      defer(() =>
        algoliasearch('BF6BT6JP9W', '52677be23c182ca96eb2ccfd7c9c459f'),
      ),
      this.data(),
    ).pipe(
      map(([algolia, institution]) =>
        algolia.initIndex(institution.algoliaIndex),
      ),
      publishReplay(1),
      refCount(),
    );
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
    return combineLatest(
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

  search(filter$) {
    return combineLatest(filter$, this.indexes).pipe(
      flatMap(([filter, indexes]) => {
        function filterAny(values, getter) {
          if (values.length == 0) {
            return results => new TypedFastBitSet();
          }
          const mask = values
            .map(x => getter(x))
            .reduce((a, b) => a.union(b), new TypedFastBitSet());
          return results => results.intersection(mask);
        }

        function* generateSubsetters(filter, indexes) {
          if (filter.query) {
          }
          if (filter.departments.length) {
            yield of(filterAny(filter.departments, x => indexes.department(x)));
          }
          if (filter.instructors.length) {
            yield of(filterAny(filter.instructors, x => indexes.instructor(x)));
          }
          yield of(filterAny(filter.periods, x => indexes.period(x)));

          // This is a rather expensive filter...
          if (filter.days) {
          }
        }

        // Generate a full state.
        const state = new TypedFastBitSet();
        state.resize(indexes.getTotalCardinality());
        for (let i = 0; i < indexes.getTotalCardinality(); i++) {
          state.add(i);
        }

        // Generate the subsetters.
        return combineLatest([...generateSubsetters(filters, indexes)]).pipe(
          map(subsetters => {
            return subsetters.reduce((state, f) => f(state), state);
          }),
          map(data => {
            let lowerBound = 0;
            const results = [];
            data.forEach(index => {
              if (index < lowerBound) {
                return;
              }
              const location = binarySearch(courseOffsets, index);
              const courseIndex = location < 0 ? ~location - 1 : location;
              results.push(courses[courseIndex]);
              lowerBound = courseOffsets[courseIndex + 1];
            });
            return { courses: results, serialized: data };
          }),
        );
      }),
    );
  }
}
