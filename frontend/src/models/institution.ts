import PackedIndex from "@/models/packed-index";
import { DocumentReference } from "@firebase/firestore-types";
import Axios from "axios";
import { Observable, combineLatest } from "rxjs";
import { map, publishReplay, refCount, switchMap } from "rxjs/operators";
import Course from "./course";
import { auth } from "./firebase";
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

type Distribution = { [gpa: number]: number };

export interface InstitutionData {
  readonly algoliaIndex: string;
  readonly name: string;
  readonly gpas: number[];
  readonly periods: Period[];
  // Other properties that really don't matter because we don't compile vue templates in ts yet.
  readonly indexesUrl: string;
  readonly cloudFunctionsUrl: string;
}

export default class Institution {
  private readonly ref: DocumentReference;
  public readonly index: PackedIndex;
  private readonly gradeDistribution: Observable<{ [gpa: number]: number }>;
  private readonly courseRanking: Observable<{ [course: string]: number }>;
  constructor(ref: DocumentReference) {
    this.ref = ref;

    this.index = new PackedIndex();

    this.data().subscribe(data => this.index.setInstitution(data));

    this.gradeDistribution = this.data().pipe(
      switchMap(data => Axios.get(`${data.cloudFunctionsUrl}/api/grades`)),
      map(
        (response: { data: any }) =>
          Object.freeze(response.data) as Distribution
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
      this.index.getSequences().pipe(
        switchMap(sequences => {
          return combineLatest(
            sequences.map(sequence => this.index.getSparseSequence(sequence))
          );
        })
      )
    ).pipe(
      map(([courseRanking, sparseSequences]) => {
        sparseSequences.forEach(sequence => {
          // Promote the rank of each course in the sequence to the max.
          const max =
            sequence
              .map(course => courseRanking[course] | 0)
              .reduce((a, b) => Math.max(a, b)) + 1;
          sequence.forEach(course => (courseRanking[course] = max));
        });
        return courseRanking;
      }),
      publishReplay(1),
      refCount()
    );
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

  watch(id: string) {
    return new Watch(this.ref.collection("watches").doc(id));
  }

  get watches(): Observable<string[]> {
    return publishIndex(this.ref.collection("watches"));
  }

  getCourseRanking(): Observable<any> {
    return this.courseRanking;
  }

  getTranscript(username: string, password: string): Observable<any> {
    return this.data().pipe(
      map(institution => institution.cloudFunctionsUrl),
      switchMap(host =>
        Axios.get(host + "/api/transcript", {
          auth: { username, password }
        })
      ),
      switchMap(response => {
        return auth.signInWithCustomToken(response.data.token).then(() => {
          response.data.data = auth.currentUser;
          return response;
        });
      })
    );
  }
}
