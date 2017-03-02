import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { Memoize } from 'typescript-memoize';
import { Program } from 'app/program';
import { AngularFire } from 'angularfire2';

/** Course catalog information service. */
@Injectable()
export class DatabaseService {
  constructor(private angularFire: AngularFire) {

  }

  @Memoize()
  get instructors(): Observable<string[]> {
    return this.angularFire.database.object('indexes/instructors').map(data => Object.keys(data));
  }

  @Memoize()
  get departments(): Observable<string[]> {
    return this.angularFire.database.object('indexes/departments').map(data => Object.keys(data));
  }

  @Memoize()
  get programs(): Observable<Program[]> {
    return this.object('programs').map(data => {
      // Turn it into a Program.
      return Object.keys(data).map(key => {
        return <Program>(Object.assign({name: key}, data[key]));
      });
    });
  }

  courseInfo(id: string): ReplaySubject<{ name: string, crosslists: string[] }> {
    return this.object('course-info/' + id);
  }

  @Memoize()
  object(id: string) {
    const replaySubject = new ReplaySubject(1);
    this.angularFire.database.object(id).subscribe(replaySubject);
    return replaySubject;
  }
}
