import { InstitutionData } from "@/models/institution";
import { Observable, Subject, fromEvent } from "rxjs";
import { filter, map, share } from "rxjs/operators";
import IndexesWorker from "worker-loader!@/workers/indexes-worker";

type UUID = string;

function uuid(): UUID {
  return ("" + 1e7 + -1e3 + -4e3 + -8e3 + -1e11).replace(/1|0/g, function() {
    return (0 | (Math.random() * 16)).toString(16);
  });
}

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
  key: UUID;
  command: WorkerCommand;
  data: any;
}

type SerializedMap = [string, [string, number[]][]][];

export default class PackedIndex {
  private readonly sink: Subject<any>;
  private readonly source: Observable<any>;
  constructor() {
    const worker = new IndexesWorker();
    this.sink = new Subject<any>();
    this.sink.subscribe(data => worker.postMessage(data));
    this.source = fromEvent(worker, "message").pipe(share());
  }

  setInstitution(data: InstitutionData) {
    this.sink.next({
      key: uuid(),
      command: WorkerCommand.SET_INSTITUTION,
      data
    });
  }

  call<I, O>(command: WorkerCommand, data: I = null): Observable<O> {
    return Observable.create(obs => {
      const key = uuid();
      const subscription = this.source
        .pipe(
          map(event => event.data as WorkerMessage),
          filter(data => data.key == key),
          map(data => data.data as O)
        )
        .subscribe(obs);
      // Send a signal to subscribe.
      this.sink.next({ key, command, data });
      return () => {
        // Send a signal to unsubscribe.
        this.sink.next({ key, command: WorkerCommand.UNSUBSCRIBE });
        // Then unsubscribe the child.
        subscription.unsubscribe();
      };
    });
  }

  getCourses(): Observable<string[]> {
    return this.call(WorkerCommand.GET_COURSES);
  }

  getTerms(): Observable<string[]> {
    return this.call(WorkerCommand.GET_TERMS);
  }

  getSections(course: string, term: string): Observable<string[]> {
    return this.call(WorkerCommand.GET_SECTIONS_FOR_COURSE_TERM, {
      course,
      term
    });
  }

  getSequences(): Observable<string[]> {
    return this.call(WorkerCommand.GET_SEQUENCES);
  }

  getSparseSequence(key: string): Observable<string[]> {
    return this.call(WorkerCommand.GET_SPARSE_SEQUENCE, key);
  }

  getDepartments(): Observable<string[]> {
    return this.call(WorkerCommand.GET_DEPARTMENTS);
  }

  getInstructors(): Observable<string[]> {
    return this.call(WorkerCommand.GET_INSTRUCTORS);
  }

  search(transcript: { course: string }[], filter: FilterState) {
    return this.call(WorkerCommand.SEARCH, { transcript, filter }).pipe(
      map((response: SerializedMap) => {
        // Deserialize to Map<string, Map<string, number[]>>
        return new Map<string, Map<string, number[]>>(
          response.map(
            ([k, v]) =>
              [k, new Map<string, number[]>(v)] as [
                string,
                Map<string, number[]>
              ]
          )
        );
      })
    );
  }
}
