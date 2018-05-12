import {
  DocumentReference,
  DocumentData,
  DocumentSnapshot,
} from '@firebase/firestore-types';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import publishDocument from './publishDocument';
import Institution from './institution';
import Section from './section';

export interface TermData {
  readonly period: string;
  readonly year: number;
  readonly sections: string[];
}

export default class Term {
  private readonly ref: DocumentReference;
  constructor(ref: DocumentReference) {
    this.ref = ref;
  }

  data(): Observable<TermData> {
    return publishDocument(this.ref) as Observable<TermData>;
  }

  get sections() {
    return this.data().pipe(map(data => data.sections));
  }

  section(id: string) {
    return new Section(this.ref.collection('sections').doc(id));
  }
}
