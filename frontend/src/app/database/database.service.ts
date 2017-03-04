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

  courseInfo(id: string): Observable<{ name: string, crosslists: string[] }> {
    if (!this._infoMemo.has(id)) {
      const subject = new ReplaySubject<{ name: string, crosslists: string[] }>(1);
      this._infoMemo.set(id, subject);
      const key = 'course-info/' + id;
      this._localChanges.subscribe(change => {
        if (!change || change.id === key) {
          this._localDB.get(key)
            .then(result => subject.next(Object.freeze(<{ name: string, crosslists: string[] }>result)))
            .catch(error => subject.next(Object.freeze({ name: null, crosslists: [] })));
        }
      });
    }
    return this._infoMemo.get(id);
  }

  /** Returns an unmemoized program Node. */
  sequence(uri: string): Observable<Node> {
    // We know that the object can be JSON'ified since it was transmitted as such from the db.
    return this.object(uri).map(node => { return <Node>JSON.parse(JSON.stringify(node)); });
  }

  schedules(filters: Filters) {
    this._cacheChanges.debounceTime(400).subscribe(() => {
      const selector = Object.assign({
        '_id': { $gt: 'schedules/', $lt: 'schedules/\uffff' }
      }, filters.selector);
      console.log('selector', selector);
      this._localDB.allDocs().then(result => console.log(result));
      // this._cacheDB.allDocs().then(result => console.log(result));
      /*this._cacheDB.find({
        selector: selector,
        limit: 15,
        fields: ['course', 'term', 'schedule']
      }).then(results => {
        console.log('done', results);
      });*/
    });
  }

  @Memoize()
  object(id: string) {
    const replaySubject = new ReplaySubject(1);
    this.angularFire.database.object(id).subscribe(replaySubject);
    return replaySubject;
  }
}
