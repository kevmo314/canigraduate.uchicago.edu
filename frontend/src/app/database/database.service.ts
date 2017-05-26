import 'localforage';

import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {AngularFireAuth} from 'angularfire2/auth';
import {AngularFireDatabase} from 'angularfire2/database';
import {Evaluation} from 'app/evaluation';
import {Node, Program} from 'app/program';
import {Section} from 'app/section';
import {Term} from 'app/term';
import {Watch} from 'app/watch';
import {environment} from 'environments/environment';
import * as firebase from 'firebase';
import localforage from 'localforage';
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {Subject} from 'rxjs/Subject';
import {Memoize} from 'typescript-memoize';

import {AuthenticationService} from './../authentication/authentication.service';

/** Course catalog information service. */
@Injectable()
export class DatabaseService {
  private _evaluationsCache = {};
  instructors: Observable<string[]>;
  departments: Observable<string[]>;
  watches: Observable<Watch[]>;
  programs: Observable<Program[]>;
  constructor(
      private angularFire: AngularFireDatabase,
      private angularFireAuth: AngularFireAuth, private http: Http,
      private authenticationService: AuthenticationService) {
    this.instructors =
        this.object('indexes/instructors').map(data => Object.keys(data));
    this.departments =
        this.object('indexes/departments').map(data => Object.keys(data));
    this.watches = this.authenticationService.credentials
                       .filter(c => c.username && c.validated)
                       .flatMap(
                           credentials => this.angularFire.list(
                               'watches/' + credentials.username));
    this.programs = this.object('programs').map(data => {
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

  addWatch(watch: Watch) {
    this.authenticationService.credentials
        .filter(c => c.username && c.validated)
        .first()
        .subscribe(credentials => {
          this.angularFire.list('watches/' + credentials.username)
              .push(Object.assign(
                  {'created': firebase.database.ServerValue.TIMESTAMP}, watch));
        });
  }

  deleteWatch(key: string) {
    this.authenticationService.credentials
        .filter(c => c.username && c.validated)
        .first()
        .subscribe(credentials => {
          this.angularFire.list('watches/' + credentials.username).remove(key);
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
    if (this._evaluationsCache[id]) {
      return this._evaluationsCache[id];
    }
    const subject = new ReplaySubject(1);
    this.authenticationService.credentials.filter(x => x.validated)
        .first()
        .flatMap(credentials => {
          return this.http
              .post(environment.backend + '/api/evaluations/' + id, credentials)
              .first()
              .catch(err => {
                console.error(err);
                return [];
              });
        })
        .map(response => response.json()['evaluations'])
        .subscribe(subject);
    return this._evaluationsCache[id] = subject;
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

  get terms(): Observable<string[]> {
    // We'll pull this one via REST to avoid unnecessary data pulls.
    const subject = new ReplaySubject(1);
    this.http
        .get(
            environment.firebaseConfig.databaseURL +
            '/indexes/terms.json?shallow=true')
        .map(result => Object.keys(result.json()).sort())
        .subscribe(subject);
    return subject;
  }

  @Memoize()
  indexes(query: string): Observable<Set<string>> {
    const key = 'indexes/' + query;
    const subject = new ReplaySubject(1);
    const indexes = this.angularFire.object(key);
    Observable.fromPromise(localforage.getItem(key))
        .filter(Boolean)
        .takeUntil(indexes)
        .concat(indexes)
        .map((values: string[]) => {
          // What the fuck, firebase...
          return new Set<string>(Array.isArray(values) ? values : []);
        })
        .subscribe(subject);
    indexes.subscribe(value => localforage.setItem(key, value));
    return subject;
  }

  @Memoize()
  grades(id: string) {
    const subject = new ReplaySubject(1);
    this.angularFire
        .list('grades/raw', {
          query: {
            orderByChild: 'course',
            startAt: id,
            endAt: id,
          },
        })
        .map(grades => {
          const distributionMap = new Map<number, number>();
          for (const grade of grades) {
            distributionMap.set(
                grade['gpa'], (distributionMap.get(grade['gpa']) || 0) + 1);
          }
          return [
            {grade: 'A', count: distributionMap.get(4) || 0},
            {grade: 'A-', count: distributionMap.get(3.7) || 0},
            {grade: 'B+', count: distributionMap.get(3.3) || 0},
            {grade: 'B', count: distributionMap.get(3) || 0},
            {grade: 'B-', count: distributionMap.get(2.7) || 0},
            {grade: 'C+', count: distributionMap.get(2.3) || 0},
            {grade: 'C', count: distributionMap.get(2) || 0},
            {grade: 'C-', count: distributionMap.get(1.7) || 0},
            {grade: 'D+', count: distributionMap.get(1.3) || 0},
            {grade: 'D', count: distributionMap.get(1) || 0},
            {grade: 'F', count: distributionMap.get(0) || 0}
          ]
        })
        .subscribe(subject);
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
