import { Injectable } from '@angular/core';
import { AngularFire, FirebaseObjectObservable } from 'angularfire2';
import { Memoize } from 'typescript-memoize';
import { Subject } from 'rxjs/Subject';
import { ReplaySubject } from 'rxjs/ReplaySubject';

/** Course catalog information service. */
@Injectable()
export class CatalogService {
  constructor(private angularFire: AngularFire) {}

  @Memoize()
  get programs(): Subject<Object> {
    const behaviorSubject = new ReplaySubject(1);
    this.angularFire.database.object('/programs').subscribe(behaviorSubject);
    return behaviorSubject;
  }

  @Memoize()
  sequences(uri: string): Subject<Object> {
    // This doesn't really need to be wrapped in CatalogService, but
    // it's here in case we want to do future data validation or something.
    if (!uri.startsWith('/sequences/')) {
      throw new Error('Not a valid sequence URI: "' + uri + '".');
    }
    const behaviorSubject = new ReplaySubject(1);
    this.angularFire.database.object(uri).subscribe(behaviorSubject);
    return behaviorSubject;
  }
}
