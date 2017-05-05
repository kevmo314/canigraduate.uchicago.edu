import {Action} from 'filnux';

export class AuthenticationState {
  username: string;
  password: string;
  /** The error message returned from the server if authenticated == false. */
  error?: string;
  /** Whether or not the username/password combination is known to be valid. */
  validated: boolean;
  constructor(previous?: AuthenticationState) {
    if (previous) {
      Object.assign(this, previous);
    }
  }
}

export class ProposeCredentialsAction extends Action<AuthenticationState> {
  constructor(private username: string, private password: string) {
    super();
  }
  reduce(state: AuthenticationState): AuthenticationState {
    return new AuthenticationState({
      username: this.username,
      password: this.password,
      error: null,
      validated: false,
    });
  }
}

export class ValidateCredentialsAction extends Action<AuthenticationState> {
  reduce(state: AuthenticationState): AuthenticationState {
    state = new AuthenticationState(state);
    state.validated = true;
    return state;
  }
}

export class RejectCredentialsAction extends Action<AuthenticationState> {
  constructor(private error: string) {
    super();
  }
  reduce(state: AuthenticationState) {
    state = new AuthenticationState(state);
    state.error = this.error;
    return state;
  }
}