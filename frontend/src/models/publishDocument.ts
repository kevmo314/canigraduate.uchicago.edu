import { DocumentReference, DocumentSnapshot } from "@firebase/firestore-types";
import { Observable } from "rxjs";
import { map, publishReplay, refCount } from "rxjs/operators";

const CACHE = new Map<string, Observable<any>>();

export default function(ref: DocumentReference): Observable<any> {
  const result = CACHE.get(ref.path);
  if (result) {
    return result;
  }
  const observable = Observable.create(observer =>
    ref.onSnapshot(observer)
  ).pipe(
    map((snapshot: DocumentSnapshot) => snapshot.data()),
    publishReplay(1),
    refCount()
  );
  CACHE.set(ref.path, observable);
  return observable;
}
