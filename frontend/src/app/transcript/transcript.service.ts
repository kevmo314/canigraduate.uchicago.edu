import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {AuthenticationService} from 'app/authentication/authentication.service';
import {Transcript} from 'app/transcript';
import {environment} from 'environments/environment';
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';

import {AuthenticationState} from '../authentication/authentication.store';

/**
 * A service that holds the currently active transcript.
 */
@Injectable()
export class TranscriptService {
  readonly transcript = new ReplaySubject<Transcript>(1);
  constructor(
      private http: Http,
      private authenticationService: AuthenticationService) {
    this.authenticationService.credentials
        .filter(x => x.password != null && x.error === null && !x.validated)
        .subscribe(data => this.bind(data));
  }

  private bind(data: AuthenticationState) {
    this.http.post(environment.backend + '/transcript', data)
        .subscribe(
            response => {
              this.transcript.next(
                  Transcript.deserialize(response.json()['transcript']));
              // Notify the authentication service that login was successful.
              this.authenticationService.validate();
            },
            err => this.authenticationService.reject(err.json()['error']),
            () => {});
  }
}
