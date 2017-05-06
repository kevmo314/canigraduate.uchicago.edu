import {Injectable} from '@angular/core';
import {environment} from 'environments/environment';
import {Store} from 'filnux';
import localforage from 'localforage';
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {Subject} from 'rxjs/Subject';

import {ACTIONS, AuthenticationState, ClearCredentialsAction, ProposeCredentialsAction, RejectCredentialsAction, ValidateCredentialsAction} from './authentication.store';

/**
 * An authentication service.
 */
@Injectable()
export class AuthenticationService {
  readonly store = new Store<AuthenticationState>({
                     initialState: new AuthenticationState()
                   }).addActions(ACTIONS);
  public credentials: Observable<AuthenticationState> =
      this.store.select(x => x);
  constructor() {
    localforage
        .getItem<{username: string, password: string}>(environment.cookieName)
        .then(value => {
          if (value) {
            setTimeout(() => this.propose(value.username, value.password), 0);
          }
        });
  }

  /** True if credentials have been issued but no response has yet been
   * received. */
  get pending(): boolean {
    return !this.error && this.store.state.password !== null && !this.validated;
  }

  get error() {
    return this.store.state.error;
  }

  get validated(): boolean {
    return this.store.state.validated;
  }

  reauthenticate(password: string): boolean {
    return this.validated && password === this.store.state.password;
  }

  propose(username: string, password: string) {
    this.store.dispatch(new ProposeCredentialsAction(username, password));
  }

  validate() {
    this.store.dispatch(new ValidateCredentialsAction());
    localforage.setItem(environment.cookieName, {
      username: this.store.state.username,
      password: this.store.state.password
    });
  }

  reject(error: string) {
    this.store.dispatch(new RejectCredentialsAction(error));
  }

  clear() {
    this.store.dispatch(new ClearCredentialsAction());
  }
}
