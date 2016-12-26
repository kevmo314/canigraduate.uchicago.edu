import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { AngularFire, FirebaseObjectObservable } from 'angularfire2';
import { Subject } from 'rxjs/Subject';

/**
 * An authentication service. 
 */
@Injectable()
export class CourseInfoService {
  private _cache: Map<string, FirebaseObjectObservable<{name: string}>>;
  constructor(
    private angularFire: AngularFire) {
      this._cache = new Map<string, FirebaseObjectObservable<{name: string}>>();
    }

  lookup(id: string): FirebaseObjectObservable<{name: string}> {
    if (!this._cache.has(id)) {
      this._cache.set(id, this.angularFire.database.object('/course-info/' + id));
    }
    return this._cache.get(id);
  }
}
