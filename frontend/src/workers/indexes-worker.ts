import IntervalTree from "@/lib/interval-tree";
import { InstitutionData } from "@/models/institution";
import * as algoliasearch from "algoliasearch";
import Axios from "axios";
import TypedFastBitSet from "fastbitset";
import {
  Observable,
  Subscription,
  combineLatest,
  defer,
  empty,
  fromEvent,
  of
} from "rxjs";
import {
  filter,
  first,
  flatMap,
  map,
  mergeAll,
  publishReplay,
  reduce,
  refCount,
  switchMap
} from "rxjs/operators";
import Indexes from "./models/indexes";

const ctx: Worker = self as any;

const messages$ = fromEvent(ctx, "message").pipe(
  map((x: any) => x.data as WorkerMessage)
);

const institutionData$ = messages$.pipe(
  filter(message => message.command == WorkerCommand.SET_INSTITUTION),
  map(message => {
    return message.data as InstitutionData;
  }),
  publishReplay(1),
  refCount()
);

const algolia = algoliasearch("BF6BT6JP9W", "52677be23c182ca96eb2ccfd7c9c459f");
const indexes$ = institutionData$.pipe(
  switchMap(institution => {
    const algoliaIndex = algolia.initIndex(institution.algoliaIndex);
    return defer(() => Axios.get(institution.indexesUrl)).pipe(
      map(response => new Indexes(response.data))
    );
  }),
  publishReplay(1),
  refCount()
);

export interface FilterState {
  query: string;
  periods: number[];
  days: any;
  departments: string[];
  instructors: string[];
  full: boolean;
  taken: boolean;
  old: boolean;
}

export enum WorkerCommand {
  SET_INSTITUTION,
  UNSUBSCRIBE,
  GET_COURSES,
  GET_TERMS,
  GET_SECTIONS_FOR_COURSE_TERM,
  GET_SPARSE_SEQUENCE,
  GET_SEQUENCES,
  GET_DEPARTMENTS,
  GET_INSTRUCTORS,
  SEARCH
}

export interface WorkerMessage {
  key: string;
  command: WorkerCommand;
  data: any;
}

const subscriptions = new Map<string, Subscription>();

function getCommandResponse(message: WorkerMessage) {
  return institutionData$.pipe(
    switchMap(institution => {
      return indexes$.pipe(
        flatMap(indexes => {
          switch (message.command) {
            case WorkerCommand.GET_COURSES:
              return of(indexes.getCourses());
            case WorkerCommand.GET_TERMS:
              return of(indexes.getTerms());
            case WorkerCommand.GET_SECTIONS_FOR_COURSE_TERM:
              return of(
                indexes.getSections(message.data.course, message.data.term)
              );
            case WorkerCommand.GET_SEQUENCES:
              return of(indexes.getSequences());
            case WorkerCommand.GET_SPARSE_SEQUENCE:
              return of(indexes.getSparseSequence(message.data));
            case WorkerCommand.GET_DEPARTMENTS:
              return of(indexes.getDepartments());
            case WorkerCommand.GET_INSTRUCTORS:
              return of(indexes.getInstructors());
            case WorkerCommand.SEARCH:
              return search(
                institution,
                algolia.initIndex(institution.algoliaIndex),
                indexes,
                message.data.transcript,
                message.data.filter
              );
            default:
              return empty();
          }
        })
      );
    })
  );
}

messages$.subscribe(message => {
  if (message.command === WorkerCommand.UNSUBSCRIBE) {
    subscriptions.get(message.key).unsubscribe();
    subscriptions.delete(message.key);
  } else {
    const subscription = getCommandResponse(message).subscribe(data => {
      ctx.postMessage({ ...message, data });
    });
    subscriptions.set(message.key, subscription);
  }
});

type SerializedMap = [string, [string, number[]][]][];

function search(
  institution: InstitutionData,
  algolia: algoliasearch.Index,
  indexes: Indexes,
  transcript: { course: string }[],
  filter: FilterState
): Observable<SerializedMap> {
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
      defer(() =>
        algolia.search({
          query: filter.query,
          attributesToRetrieve: [],
          attributesToHighlight: [],
          allowTyposOnNumericTokens: false,
          hitsPerPage: 1000
        })
      ).pipe(
        map(results => results.hits.map(result => result.objectID)),
        // Map the list of course identifiers to the corresponding bitset.
        map(courses => indexes.getBitSetForCourses(courses)),
        // Apply the exact query match mask.
        map(mask =>
          mask.union(
            indexes.getBitSetForCourses(
              indexes
                .getCourses()
                .filter(x => x.includes(filter.query.toUpperCase()))
            )
          )
        ),
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
    subsetters.push(filterAny(filter.departments, x => indexes.department(x)));
  }
  if (filter.instructors.length) {
    subsetters.push(filterAny(filter.instructors, x => indexes.instructor(x)));
  }
  subsetters.push(
    filterAny(filter.periods.filter(x => x < institution.periods.length), x =>
      indexes.period(institution.periods[x].name)
    )
  );

  // This is a rather expensive filter...
  if (filter.days) {
    const it = filter.days
      .map(day => [1440 * day, 1440 * (day + 1)])
      .reduce((tree, interval) => tree.add(interval), new IntervalTree());
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
    map(data => indexes.getCourseTermSections(data)),
    map(map => {
      return Array.from(map.entries()).map(([k, v]) => {
        return [k, Array.from(v.entries())];
      }) as SerializedMap;
    })
  );
}
