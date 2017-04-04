import {Injectable, Type} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';

import {RootState} from './root_state';
import {Action, State} from './store_module';


/**
 * A Store observes Actions and emits States.
 *
 * Actions are sent to the RootState, which applies the transformation for each
 * matching reducer, then emits the state on that specification node after
 * reduction back to the store.
 */
@Injectable()
export class Store<T> implements Observer<Action> {
  constructor(private rootState: RootState) {}

  select(module: Type<any>): Observable<Readonly<T>> {
    return this.rootState
        .filter(specificationNode => specificationNode.module === module)
        .map(node => Object.freeze(<T>node.state));
  }

  dispatch<A extends Action>(action: A) {
    this.rootState.update(action);
  }

  next(action: Action) {
    this.rootState.update(action);
  }

  error(err: any) {
    this.rootState.error(err);
  }

  complete() {
    this.rootState.complete();
  }
}