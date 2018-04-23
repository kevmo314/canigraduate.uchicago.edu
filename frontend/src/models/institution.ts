import { Observable } from 'rxjs/Observable';
import {
  DocumentReference,
  DocumentData,
  DocumentSnapshot,
} from '@firebase/firestore-types';
import { map } from 'rxjs/operators';
import firestore from './firestore';
import publishDocument from './publishDocument';
import Grades from './grades';
import Course from './course';
import Sequence from './sequence';
import Axios from 'axios';
import { HOST } from './functions';
import Watch from './watch';

interface Period {
  readonly name: string;
  readonly shorthand: string;
  readonly color: string;
}

export interface InstitutionData {
  readonly name: string;
  readonly gpas: number[];
  readonly periods: Period[];
  // Other properties that really don't matter because we don't compile vue templates in ts yet.
}
interface Distribution {
  [gpa: number]: number;
}

export default class Institution {
  private readonly ref: DocumentReference;
  constructor(ref: DocumentReference) {
    this.ref = ref;
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

  getGradeDistribution(): Observable<Distribution> {
    return Observable.defer(() => Axios.get(HOST + '/api/grades'))
      .map(response => Object.freeze(response.data) as Distribution)
      .publishReplay(1)
      .refCount();
  }

  get courses() {
    // Temporary.
    return Observable.of(['MATH 15100', 'MATH 15200']);
  }

  watch(id: string) {
    return new Watch(this.ref.collection('watches').doc(id));
  }
}
