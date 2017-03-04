import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { Memoize } from 'typescript-memoize';
import { Program, Node } from 'app/program';
import { Filters } from 'app/course-search/filters';
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
      return Object.keys(data).filter(key => data[key]['requirements']).map(key => {
        const program = new Program(this);
        program.name = key;
        program.metadata = data[key]['metadata'];
        program.requirements = data[key]['requirements'];
        return program.finalize();
      });
    });
  }

  courseInfo(id: string): Observable<{ name: string, crosslists: string[] }> {
    return this.object('course-info/' + id);
  }

  /** Returns an unmemoized program Node. */
  sequence(uri: string): Observable<Node> {
    // Create a copy of the output object, it's faster than retransmitting over the wire.
    // We know that the object can be JSON'ified since it was transmitted as such from the db.
    return this.object(uri).map(node => { return <Node>JSON.parse(JSON.stringify(node)); });
  }

  schedules(filters: Filters) {
  }

  @Memoize()
  object(id: string) {
    const replaySubject = new ReplaySubject(1);
    this.angularFire.database.object(id).subscribe(replaySubject);
    return replaySubject;
  }
}
