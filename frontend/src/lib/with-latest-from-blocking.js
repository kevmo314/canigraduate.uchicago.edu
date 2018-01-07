import 'rxjs/add/operator/combineLatest';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/skip';
import 'rxjs/add/operator/withLatestFrom';
import 'rxjs/add/operator/concat';
import 'rxjs/add/operator/share';

export default function(...observables) {
  return source => {
    const published = source.share();
    return published
      .combineLatest(...observables)
      .take(1)
      .concat(published.skip(1).withLatestFrom(...observables));
  };
}
