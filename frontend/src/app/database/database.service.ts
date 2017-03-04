import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { Memoize } from 'typescript-memoize';
import { Program, Node } from 'app/program';
import { Filters } from 'app/course-search/filters';
import * as PouchDB from 'pouchdb-browser';
import * as PouchDBMemory from 'pouchdb-memory';
import * as PouchDBFind from 'pouchdb-find';

PouchDB.plugin(PouchDBFind);
// PouchDB.plugin(PouchDBMemory);

/** Course catalog information service. */
@Injectable()
export class DatabaseService {
  private _localDB: PouchDB.Database<any> = new PouchDB(environment.pouchConfig.localPath, { auto_compaction: true });
  private _remoteDB: PouchDB.Database<any> = new PouchDB(environment.pouchConfig.remotePath);
  private _cacheDB: PouchDB.Database<any> = new PouchDBMemory('local' + environment.pouchConfig.localPath, {
    adapter: 'memory', auto_compaction: true
  });
  private _activeDB: PouchDB.Database<any>;
  private _infoMemo: Map<string, any> = new Map<string, any>();

  _localChanges: Subject<any> = new ReplaySubject<any>(1);
  _cacheChanges: Subject<any> = new ReplaySubject<any>(1);

  constructor() {
    if (environment.production) {
      PouchDB.debug.disable();
    } else {
      PouchDB.debug.enable('pouchdb:find');
    }
    console.log(this._localDB, this._remoteDB, this._cacheDB);
    // Set up replication.
    this._remoteDB.replicate.to(this._localDB, {
      live: true,
      retry: true,
      batch_size: 5000,
      filter: 'canigraduate/deleted'
    });
    this._localDB.replicate.to(this._cacheDB, {
      live: true,
      retry: true,
      filter: function (doc) {
        return doc._id > 'schedules/' && doc._id < 'schedules/\uffff';
      }
    });
    this._cacheDB.createIndex({
      index: {
        fields: ['period']
      }
    });
    this._localChanges.next(null);
    this._localDB.changes({ since: 'now', live: true }).on('change', change => {
      this._localChanges.next(change);
    });
    this._cacheChanges.next(null);
    this._cacheDB.changes({ since: 'now', live: true }).on('change', change => {
      this._cacheChanges.next(change);
    });
  }

  @Memoize()
  get programs(): ReplaySubject<Program[]> {
    const replaySubject = new ReplaySubject(1);
    this._localChanges.subscribe(() => {
      this._localDB.allDocs({
          startkey: 'programs/',
          endkey: 'programs/\uffff',
          include_docs: true
        })
        .then(result => replaySubject.next(result.rows.map(x => x.doc)
        .map(x => {
          const program = new Program(this);
          program.name = x['_id'].substring('programs/'.length);
          program.metadata = x['metadata'];
          program.requirements = x['requirements'];
          return program.finalize();
        })))
        .catch(error => {
          console.error(error);
        });
    });
    return replaySubject;
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
  object(id: string): Observable<any> {
    const replaySubject = new ReplaySubject(1);
    this._localChanges.subscribe(() => {
      this._localDB.get(id)
        .then(result => replaySubject.next(result))
        .catch(error => {
          console.error('Error resolving ', id);
          console.error(error);
        });
    });
    return replaySubject;
  }
}
