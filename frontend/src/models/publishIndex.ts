import { CollectionReference, QuerySnapshot } from '@firebase/firestore-types';
import { Observable } from 'rxjs';
import { publishReplay, refCount, map } from 'rxjs/operators';

const CACHE = new Map<string, Observable<string[]>>();

export default function(ref: CollectionReference): Observable<string[]> {
  const result = CACHE.get(ref.path);
  if (result) {
    return result;
  }
  const observable = Observable.create(observer =>
    ref.onSnapshot(observer),
  ).pipe(
    map((snapshot: QuerySnapshot) => {
      const ids: string[] = [];
      snapshot.forEach(doc => ids.push(doc.id));
      return ids;
    }),
    publishReplay(1),
    refCount(),
  );
  CACHE.set(ref.path, observable);
  return observable;
}
