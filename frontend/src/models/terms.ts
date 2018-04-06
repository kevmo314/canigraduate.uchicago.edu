import { Observable } from 'rxjs/Observable';
import {
  DocumentSnapshot,
  QuerySnapshot,
  CollectionReference,
} from '@firebase/firestore-types';
import { map } from 'rxjs/operators';
import Sections from './sections';
import Term from './term';

export default class Terms {
  private ref: CollectionReference;

  constructor(ref: CollectionReference) {
    this.ref = ref;
  }

  public get(id: string): Observable<Term> {
    const ref = this.ref.doc(id);
    return Observable.create(observer => ref.onSnapshot(observer)).pipe(
      map((snapshot: DocumentSnapshot) => new Term(ref, snapshot.data())),
    );
  }

  public list(): Observable<string[]> {
    return Observable.create(observer => this.ref.onSnapshot(observer)).pipe(
      map((snapshot: QuerySnapshot) => {
        const results = [];
        snapshot.forEach(result => results.push(result.id));
        return results;
      }),
    );
  }
}
