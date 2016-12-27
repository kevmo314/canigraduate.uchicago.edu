import { Injectable } from '@angular/core';
import { AngularFire, FirebaseObjectObservable } from 'angularfire2';
import { Memoize } from 'typescript-memoize';

/** Course catalog information service. */
@Injectable()
export class CatalogService {
  constructor(private angularFire: AngularFire) {}

  @Memoize()
  get programs(): FirebaseObjectObservable<any> {
    return this.angularFire.database.object('/programs');
  }
}
