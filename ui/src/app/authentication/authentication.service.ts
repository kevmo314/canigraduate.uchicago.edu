import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Subject } from 'rxjs/Subject';

/**
 * An authentication service. 
 */
@Injectable()
export class AuthenticationService extends Subject<{username: string, password: string}> {
  private _locked: boolean = false;
  private _valid: boolean = true;
  private _authenticated: boolean = false;
  constructor (private http: Http) {
    super();
  }

  get locked() {
    return this._locked;
  }

  get valid() {
    return this._valid;
  }

  get authenticated() {
    return this._authenticated;
  }

  next(data: {username: string, password: string}) {
    if (!this._locked) {
      this._locked = true;
      this._valid = true;
      super.next(data);
    }
  }
  
  error(err: any) {
    this._locked = false;
    // Intercept error as we don't want to terminate the stream.
    // Instead, flag the state as invalid.
    this._valid = false;
  }

  complete() {
    this._authenticated = true;
  }

  reset() {
    this._locked = false;
    this._valid = true;
    this._authenticated = false;
  }
}
