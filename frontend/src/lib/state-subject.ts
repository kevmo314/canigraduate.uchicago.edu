import { ReplaySubject, SchedulerLike } from "rxjs";

class StateSubject<T> extends ReplaySubject<T> {
  constructor(
    bufferSize?: number,
    windowTime?: number,
    scheduler?: SchedulerLike
  ) {
    super(bufferSize, windowTime, scheduler);
  }
}
