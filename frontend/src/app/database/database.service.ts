import {Injectable} from '@angular/core';
import {AngularFire} from 'angularfire2';
import {Node, Program} from 'app/program';
import {Section} from 'app/section';
import {Term} from 'app/term';
import {environment} from 'environments/environment';
import localforage from 'localforage';
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import { Subject } from 'rxjs/Subject';
import { Memoize } from 'typescript-memoize';
import 'localforage';

/** Course catalog information service. */
@Injectable()
export class DatabaseService {
  constructor(private angularFire: AngularFire) {}

  @Memoize()
  get instructors(): Observable<string[]> {
    return this.object('indexes/instructors').map(data => Object.keys(data));
  }

  @Memoize()
  get departments(): Observable<string[]> {
    return this.object('indexes/departments').map(data => Object.keys(data));
  }

  @Memoize()
  get programs(): Observable<Program[]> {
    return this.object('programs').map(data => {
      // Turn it into a Program.
      return Object.keys(data)
          .filter(key => data[key]['requirements'])
          .map(key => {
            const program = new Program(this);
            program.name = key;
            program.metadata = data[key]['metadata'];
            program.requirements = data[key]['requirements'];
            return program.finalize();
          });
    });
  }

  // TODO: This can probably be refactored.
  name(id: string): Observable<string> {
    return this.object(`course-info/${id}/name`);
  }

  crosslists(id: string): Observable<string[]> {
    return this.object(`course-info/${id}/crosslists`);
  }

  description(id: string): Observable<string> {
    return this.object(`course-info/${id}/description`);
  }

  /** Returns an unmemoized program Node. */
  sequence(uri: string): Observable<Node> {
    // Create a copy of the output object, it's faster than retransmitting over
    // the wire. We know that the object can be JSON'ified since it was
    // transmitted as such from the db.
    return this.object(uri).map(node => {
      return <Node>JSON.parse(JSON.stringify(node));
    });
  }

  schedules(id: string): Observable<any> {
    return this.object('schedules/' + id);
  }

  indexes(query: string): Observable<any> {
    const key = 'indexes/' + query;
    const subject = new ReplaySubject(1);
    const indexes = this.angularFire.database.object(key);
    Observable.fromPromise(localforage.getItem(key)).filter(Boolean).takeUntil(indexes).concat(indexes).subscribe(subject);
    indexes.subscribe(value =>  localforage.setItem(key, value));
    return subject;
  }

  @Memoize()
  object(id: string) {
    const replaySubject = new ReplaySubject(1);
    this.angularFire.database.object(id)
        .map(x => {
          if (!x.$exists()) {
            return null;
          }
          if ('$value' in x) {
            return x['$value'];
          }
          return x;
        })
        .subscribe(replaySubject);
    return replaySubject;
  }
}
