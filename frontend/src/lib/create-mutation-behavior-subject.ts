import { BehaviorSubject, Subject } from "rxjs";
import { map } from "rxjs/operators";

export default function createMutationBehaviorSubject<T>(
  value: T
): [Subject<(state: T) => T>, BehaviorSubject<T>] {
  const source = new BehaviorSubject<T>(value);
  const sink = new Subject<(state: T) => T>();
  sink.pipe(map(fn => fn(source.value))).subscribe(source);
  return [sink, source];
}
