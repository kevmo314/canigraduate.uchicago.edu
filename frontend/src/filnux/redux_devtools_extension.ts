import {Inject, Injectable, Type} from '@angular/core';
import {parse} from 'jsan';
import {Observable} from 'rxjs/Observable';

import {RootState} from './root_state';
import {Action, Reducer, State} from './store_module';
import {REDUX_DEVTOOLS_EXTENSION} from './tokens';

type ReduxAction = {
  type: string
};

export interface ReduxDevtoolsOptions {
  name?: string;
  actionCreators?: Object|Object[];
  latency?: number;
  maxAge?: number;
  serialize?: Object|boolean;
  // A bunch of other stuff todo later...
}

interface ReduxDevtoolsConnection {
  subscribe(listener: (message: any) => void);
  unsubscribe();
  // These accept more types, however we can restrict them since we're the only
  // consumers and typechecking is nice.
  send(action: ReduxAction, state: State);
  init(state: State);
  error(message: string);
}

interface LiftedState {
  nextActionId: number;
  actionsById:
      {[id: number]: {action: ReduxAction, timestamp: number, type: string}};
  stagedActionIds: number[];
  skippedActionIds: number[];
  committedState: State;
  currentStateIndex: number;
  computedStates: {state: State, error: any}[];
}

class InitializationAction implements Action {
  type = '[Filnux] Initialization';
  constructor(private state: State) {}
  reduce(state: State): State {
    return this.state;
  }
}

@Injectable()
export class ReduxDevtoolsExtension {
  private conn: ReduxDevtoolsConnection;
  private actions: Map<string, Action> = new Map<string, Action>();
  private initialState: State;
  private committedState: State;
  constructor(
      @Inject(REDUX_DEVTOOLS_EXTENSION) private args: ReduxDevtoolsOptions,
      private rootState: RootState) {
    if (typeof window !== 'object' || !window['__REDUX_DEVTOOLS_EXTENSION__']) {
      return;
    }
    this.conn = window['__REDUX_DEVTOOLS_EXTENSION__'].connect(args);
    this.conn.init({});
    this.rootState.normalized.subscribe(
        ({action, state}: {action: Action, state: State}) => {
          if (!action) {
            action = new InitializationAction(this.initialState = state);
          }
          this.actions.set(action.type, Object.getPrototypeOf(action));
          // Preemptively resolve .type, as it may be a getter.
          this.conn.send(Object.assign({type: action.type}, action), state);
        });
    const actions = new Observable<any>(subscriber => {
      return this.conn.subscribe((message) => subscriber.next(message));
    });

    const startActions = actions.filter(action => action.type === 'START');
    const stopActions = actions.filter(action => action.type === 'STOP');

    const dispatchActions =
        actions.filter(action => action.type === 'DISPATCH');
    const actionActions = actions.filter(action => action.type === 'ACTION');

    startActions.switchMap(() => dispatchActions.takeUntil(stopActions))
        .subscribe(({payload, state}) => this.dispatch(payload, state));
  }

  /**
   * Attempts to convert a primitive Redux action (which does not have a
   * reduce() function) into an action that our root state can understand. It
   * does this by checking against previously seen actions from the action
   * listener.
   * @param reduxAction The action to resolve.
   * @returns An object subclassing Action that matches the type that reduxAction represents.
   */
  private resolveAction(reduxAction: ReduxAction): Action {
    if (this.actions.has(reduxAction.type)) {
      const target: Action =
          Object.create(this.actions.get(reduxAction.type), {});
      for (const property in reduxAction) {
        if (reduxAction.hasOwnProperty(property) && property !== 'type') {
          try {
            target[property] = reduxAction[property];
          } catch (err) {
            console.warn(
                'Unable to assign property "' + property + '". ' +
                'If this is a getter, then this warning can safely be ignored.');
          }
        }
      }
      return target;
    }
    throw new Error(
        'Unable to resolve action "' + reduxAction.type + '". ' +
        'The store may not have seen this action yet, and cannot handle actions that it has not seen. ' +
        'This is a known limitation of Filnux.');
  }

  private toggleAction(actionId: number, liftedState: LiftedState) {
    const skipped = new Set(liftedState.skippedActionIds);
    if (skipped.has(actionId)) {
      skipped.delete(actionId);
    } else {
      skipped.add(actionId);
    }
    const index = liftedState.stagedActionIds.indexOf(actionId);
    if (index === -1) {
      return liftedState;
    }
    // Set the root state to what it was before the toggled action.
    this.rootState.denormalize(liftedState.computedStates[index - 1].state);
    // Then recompute the states.
    for (let i = index; i < liftedState.stagedActionIds.length; i++) {
      if (skipped.has(liftedState.stagedActionIds[i])) {
        liftedState.computedStates[i].state =
            liftedState.computedStates[i - 1].state;
        continue;
      }
      try {
        const action = this.resolveAction(
            liftedState.actionsById[liftedState.stagedActionIds[i]].action);
        this.rootState.update(action, true);
        liftedState.computedStates[i].state = this.rootState.normalize();
      } catch (err) {
        liftedState.computedStates[i].state =
            liftedState.computedStates[i - 1].state;
        this.conn.error(err.message);
      }
    }
    liftedState.skippedActionIds = Array.from(skipped);
    return liftedState;
  }

  private dispatch(payload, state: string): LiftedState {
    switch (payload.type) {
      case 'RESET':
        this.conn.init({});
        this.conn.send(
            new InitializationAction(this.initialState), this.initialState);
        this.rootState.denormalize(this.initialState);
        return;
      case 'COMMIT':
        this.conn.init({});
        this.committedState = this.rootState.normalize();
        this.conn.send(
            new InitializationAction(this.committedState), this.committedState);
        return;
      case 'ROLLBACK':
        this.conn.init({});
        this.conn.send(
            new InitializationAction(this.committedState), this.committedState);
        this.rootState.denormalize(this.committedState);
        return;
      case 'JUMP_TO_STATE':
      case 'JUMP_TO_ACTION':
        this.rootState.denormalize(<State>parse(state));
        return;
      case 'TOGGLE_ACTION':
        this.conn.send(
            null, this.toggleAction(payload.id, <LiftedState>parse(state)));
        return;
      case 'IMPORT_STATE':
        const computedStates = payload.nextLiftedState.computedStates;
        this.rootState.denormalize(
            computedStates[computedStates.length - 1].state);
        this.conn.send(null, payload.nextLiftedState);
        return;
    }
  }
}
