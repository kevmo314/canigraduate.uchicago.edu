import { Injectable } from '@angular/core';
import { AngularFire, FirebaseObjectObservable } from 'angularfire2';

/** Course catalog information service. */
@Injectable()
export class CatalogService {
  private _programs: FirebaseObjectObservable<any>;
  constructor(
    private angularFire: AngularFire) {
      this._programs = this.angularFire.database.object('/programs');
    }
  get programs(): FirebaseObjectObservable<any> {
    return this._programs;
  }
}
