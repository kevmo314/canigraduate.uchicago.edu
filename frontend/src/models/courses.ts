import { Observable } from 'rxjs/Observable';
import {
  DocumentSnapshot,
  CollectionReference,
} from '@firebase/firestore-types';
import { map } from 'rxjs/operators';
import Terms from './terms';
import Course from './course';

export default class Courses {
  private root: CollectionReference;

  constructor(root: CollectionReference) {
    this.root = root;
  }

  public get(id: string): Observable<Course> {
    const ref = this.root.doc(id);
    return Observable.create(observer => ref.onSnapshot(observer)).pipe(
      map((snapshot: DocumentSnapshot) => new Course(ref, snapshot)),
    );
  }
}
