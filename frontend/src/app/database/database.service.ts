import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Memoize } from 'typescript-memoize';
import { Program } from 'app/program';

/** Course catalog information service. */
@Injectable()
export class DatabaseService {
  private _localDB: PouchDB.Database<any> = new PouchDB(environment.pouchConfig.localPath);
  private _remoteDB: PouchDB.Database<any> = new PouchDB(environment.pouchConfig.remotePath);

  private _changeObservable: Subject<void> = new Subject<void>();

  constructor() {
    if (environment.production) {
      PouchDB.debug.disable();
    } else {
      PouchDB.debug.enable('*');
    }
    // Set up replication.
    this._remoteDB.replicate
      .to(this._localDB, {
        live: true,
        retry: true
      })
      .on('complete', () => this._changeObservable.next())
      .on('change', () => this._changeObservable.next());
    this._installQueries().then(() => this._changeObservable.next());
  }

  /** Install or updateindexed queries on the local database. */
  private _installQueries(retries: number = 3): Promise<any> {
    // Design documents do not replicate if not admin, so there's no id collision here.
    // http://stackoverflow.com/questions/12510665/couchdb-not-replicating-design-documents
    return this._localDB.get('_design/canigraduate')
      .catch(error => ({ '_id': '_design/canigraduate' }))
      .then(doc => {
        doc['views'] = {
          'programs': {
            'map': 'function(doc) { if (!doc._id.indexOf("programs/")) { emit(doc); } }'
          }
        };
        this._localDB.changes({
          'filter': '_view',
          'since': 'now',
          'view': 'canigraduate/programs'
        }).on('change', change => {
          console.log('change from local');
          console.log(change);
        });
        return this._localDB.put(doc);
      })
      .catch(error => {
        if (retries > 0) {
          console.error("Failed to install queries, retrying...");
          console.error(error);
          return this._installQueries(retries - 1);
        }
        throw error;
      });
  }

  @Memoize()  
  get programs(): ReplaySubject<Program[]> {
    const replaySubject = new ReplaySubject(1);
    this._changeObservable.subscribe(() => {
      this._localDB.query('canigraduate/programs')
        .then(result => replaySubject.next(result.rows.map(x => x.key)))
        .catch(error => {
          console.error(error);
        });
    })
    return replaySubject;
  }

  courseInfo(id: string): ReplaySubject<{ name: string, crosslists: string[] }> {
    return this.object('course-info/' + id);
  }

  @Memoize()  
  object(id: string) {
    const replaySubject = new ReplaySubject(1);
    this._localDB.get(id)
      .then(result => replaySubject.next(result))
      .catch(error => {
        console.error("Error resolving ", id);
        console.error(error);
      });
    return replaySubject;
  }
}
