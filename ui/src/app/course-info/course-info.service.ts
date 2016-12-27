import { TranscriptRecord } from '../transcript/transcript-record';
import { Injectable } from '@angular/core';
import { AngularFire, FirebaseObjectObservable } from 'angularfire2';
import { Memoize } from 'typescript-memoize';
import { Subject } from 'rxjs/Subject';
import { ReplaySubject } from 'rxjs/ReplaySubject';

/**
 * An authentication service. 
 */
@Injectable()
export class CourseInfoService {
  constructor(private angularFire: AngularFire) {}

  @Memoize()
  lookup(id: string): Subject<{name: string, crosslists: string[]}> {
    const behaviorSubject = new ReplaySubject(1);
    this.angularFire.database.object('/course-info/' + id).subscribe(behaviorSubject);
    return behaviorSubject;
  }
}
