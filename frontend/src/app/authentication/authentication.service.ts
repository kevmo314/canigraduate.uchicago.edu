import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { CookieService } from 'angular2-cookie/core';
import { Subject } from 'rxjs/Subject';

import { environment } from 'environments/environment';

/**
 * An authentication service.
 */
@Injectable()
export class AuthenticationService extends Subject<{username: string, password: string}> {
  private _data: {username: string, password: string};
  private _valid = true;
  private _authenticated = false;
  private _error: string;
  constructor(
    private http: Http,
    private cookieService: CookieService) {
    super();
    const cookie = <{username: string, password: string}> this.cookieService.getObject(environment.cookieName);
    if (cookie) {
      setTimeout(() => this.next(cookie), 0);
    }
  }

  get locked(): boolean {
    return this._data != null;
  }

  get valid(): boolean {
    return this._valid;
  }

  get message() {
    // Unfortunately we have no way to notify failures.
    return this._error;
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

  error(err: string): void {
    this._data = null;
    // Intercept error as we don't want to terminate the stream.
    // Instead, flag the state as invalid.
    this._valid = false;
    this._error = err;
  }

  complete(): void {
    this._authenticated = true;
    // Save the credentials to a cookie, clear the password if prod.
    if (environment.production) {
      this._data.password = null;
    }
    this.cookieService.putObject(environment.cookieName, this._data);
  }

  reset(): void {
    this._data = null;
    this._valid = true;
    this._authenticated = false;
    this.cookieService.remove(environment.cookieName);
  }
}
