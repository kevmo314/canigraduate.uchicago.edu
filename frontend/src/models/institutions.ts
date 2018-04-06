import {
  CollectionReference,
  DocumentSnapshot,
  QuerySnapshot,
} from '@firebase/firestore-types';
import { Observable } from 'rxjs/Observable';
import Institution from './institution';
import { map } from 'rxjs/operators';

export default class Institutions {
  private ref: CollectionReference;

  constructor(ref: CollectionReference) {
    this.ref = ref;
  }

  public get(id: string): Observable<Institution> {
    const ref = this.ref.doc(id);
    return Observable.create(observer => ref.onSnapshot(observer)).pipe(
      map(
        (snapshot: DocumentSnapshot) => new Institution(ref, snapshot.data()),
      ),
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
