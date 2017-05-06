import 'localforage';

import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {AngularFireDatabase} from 'angularfire2/database';
import {Evaluation} from 'app/evaluation';
import {Node, Program} from 'app/program';
import {Section} from 'app/section';
import {Term} from 'app/term';
import {environment} from 'environments/environment';
import localforage from 'localforage';
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {Subject} from 'rxjs/Subject';
import {Memoize} from 'typescript-memoize';

import {AuthenticationService} from './../authentication/authentication.service';

/** Course catalog information service. */
@Injectable()
export class DatabaseService {
  constructor(
      private angularFire: AngularFireDatabase, private http: Http,
      private authenticationService: AuthenticationService) {}

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

  evaluations(id: string): Observable<Evaluation[]> {
    return this.authenticationService.credentials.filter(x => x.validated)
        .first()
        .flatMap(credentials => {
          return this.http
              .post(
                  'https://us-central1-canigraduate-43286.cloudfunctions.net/evaluations?id=' +
                      id,
                  credentials)
              .first();
        })
        .map(response => response.json());
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

  indexes(query: string): Observable<Set<string>> {
    const key = 'indexes/' + query;
    const subject = new ReplaySubject(1);
    const indexes = this.angularFire.object(key);
    Observable.fromPromise(localforage.getItem(key))
        .filter(Boolean)
        .takeUntil(indexes)
        .concat(indexes)
        .map((values: string[]) => {
          return new Set<string>(values);
        })
        .subscribe(subject);
    indexes.subscribe(value => localforage.setItem(key, value));
    return subject;
  }

  @Memoize()
  object(id: string) {
    const replaySubject = new ReplaySubject(1);
    this.angularFire.object(id)
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
