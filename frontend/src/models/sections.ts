import { Observable } from 'rxjs/Observable';
import {
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  CollectionReference,
} from '@firebase/firestore-types';
import { map } from 'rxjs/operators';

interface Enrollment {
  enrolled?: number;
  maximum?: number;
}

interface Section {
  enrollment: Enrollment;
  notes: string[];
  primaries: any;
  secondaries: any;
}

export default class Sections {
  private root: CollectionReference;

  constructor(root: CollectionReference) {
    this.root = root;
  }

  public get(id: string): Observable<Section> {
    return Observable.create(observer =>
      this.root.doc(id).onSnapshot(observer),
    ).pipe(map((snapshot: DocumentSnapshot) => snapshot.data() as Section));
  }

  public list(): Observable<string[]> {
    return Observable.create(observer => this.root.onSnapshot(observer)).pipe(
      map((snapshot: QuerySnapshot) => {
        const results = [];
        snapshot.forEach(result => results.push(result.id));
        return results;
      }),
    );
  }
}
