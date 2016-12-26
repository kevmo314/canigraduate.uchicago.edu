import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Subject } from 'rxjs/Subject';

/**
 * An authentication service. 
 */
@Injectable()
export class AuthenticationService extends Subject<{username: string, password: string}> {
  private _data: {username: string, password: string} = null;
  private _valid: boolean = true;
  private _authenticated: boolean = false;
  constructor(private http: Http) {
    super();
  }

  get locked(): boolean {
    return this._data != null;
  }

  get valid(): boolean {
    return this._valid;
  }

  get authenticated(): boolean {
    return this._authenticated;
  }

  reauthenticate(password: string): boolean {
    return this.locked && password === this._data['password'];
  }

  next(data: {username: string, password: string}): void {
    if (!this.locked) {
      this._data = data;
      this._valid = true;
      super.next(data);
    }
  }
  
  error(err: any): void {
    this._data = null;
    // Intercept error as we don't want to terminate the stream.
    // Instead, flag the state as invalid.
    this._valid = false;
  }

  complete(): void {
    this._authenticated = true;
  }

  reset(): void {
    this._data = null;
    this._valid = true;
    this._authenticated = false;
  }
}
