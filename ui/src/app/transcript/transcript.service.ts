import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

import {AuthenticationService} from 'app/authentication/authentication.service';
import { Transcript } from './transcript';

import { environment } from 'environments/environment';

/**
 * A service that holds the currently active transcript.
 */
@Injectable()
export class TranscriptService {
  private _transcript: Transcript;
  constructor (
    private http: Http,
    private authenticationService: AuthenticationService) {
    this.authenticationService.subscribe(data => this.bind(data));
  }

  get transcript() {
    return this._transcript;
  }

  private bind(data: {username: string, password: string}) {
    this.http.post(environment.backend + '/api/transcript', data)
      .subscribe(response => {
        this._transcript = Transcript.deserialize(response.json()['transcript']);
        // Notify the authentication service that login was successful.
        this.authenticationService.complete();
      },
      err => this.authenticationService.error(err),
      () => {});
  }
}
