import 'rxjs/Rx';
import { Transcript } from './transcript';
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { AuthenticationService } from 'app/authentication/authentication.service';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';

/**
 * A service that holds the currently active transcript.
 */
@Injectable()
export class TranscriptService {
  private _transcript: ReplaySubject<Transcript>;
  constructor(private http: Http, private authenticationService: AuthenticationService) {
    this._transcript = new ReplaySubject<Transcript>(1);
    this.authenticationService
      .filter(x => x.password != null)
      .subscribe(data => this.bind(data));
  }

  get transcript(): Observable<Transcript> {
    return this._transcript;
  }

  private bind(data: {username: string, password: string}) {
    this.http.post(environment.backend + '/api/transcript', data)
      .subscribe(response => {
        this._transcript.next(Transcript.deserialize(response.json()['transcript']));
        // Notify the authentication service that login was successful.
        this.authenticationService.complete();
      },
      err => this.authenticationService.error(err),
      () => {});
  }
}
