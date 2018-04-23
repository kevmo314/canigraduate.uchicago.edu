import { Observable } from 'rxjs/Observable';
import {
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  CollectionReference,
} from '@firebase/firestore-types';
import { map } from 'rxjs/operators';
import Section from './section';
import { HOST } from './functions';
import axios from 'axios';

interface Distribution {
  [gpa: number]: number;
}

export default class Grades {
  private readonly ref: CollectionReference;

  constructor(ref: CollectionReference) {
    this.ref = ref;
  }

  public distribution(): Observable<Distribution> {
    return Observable.defer(() => axios.get(HOST + '/api/grades'))
      .map(response => Object.freeze(response.data) as Distribution)
      .publishReplay(1)
      .refCount();
  }
}
