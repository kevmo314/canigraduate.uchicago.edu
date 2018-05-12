import {
  combineLatest,
  take,
  concat,
  skip,
  withLatestFrom,
} from 'rxjs/operators';

export default function(...observables) {
  return source => {
    const published = source.share();
    return published.pipe(
      combineLatest(...observables),
      take(1),
      concat(published.pipe(skip(1), withLatestFrom(...observables))),
    );
  };
}
