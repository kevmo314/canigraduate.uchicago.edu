import {Injectable} from '@angular/core';
import {Action} from 'filnux/store_module';
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {BehaviorSubject, Subject} from 'rxjs/Rx';

import {SpecificationNode, State} from './store_module';

@Injectable()
export class RootState extends ReplaySubject<SpecificationNode> {
  private root: SpecificationNode;
  readonly actionListener = new ReplaySubject<Action>(1);
  readonly normalized: Observable<{action: Action, state: State}>;

  constructor() {
    super(1);
    this.normalized = this.actionListener.map(action => {
      return {action, state: this.normalize()};
    });
  }

  initialize(specificationNode: SpecificationNode) {
    this.root = specificationNode;
    this.update(null);
  }

  update(action: Action, silent: boolean = false) {
    this.recurse(action, this.root);
    if (!silent) {
      this.actionListener.next(action);
    }
  }

  private recurse(action: Action, node: SpecificationNode) {
    const state = node.reducer(node.state, action);
    if (state !== node.state) {
      node.state = state;
      this.next(node);
    }
    for (const child of node.children) {
      this.recurse(action, child);
    }
  }

  /**
   * Returns a normalized state which follows the object pattern more common
   * among Redux implementations.
   * @returns A normalized `State`.
   */
  normalize(node: SpecificationNode = this.root): State {
    const state = {};
    if (node.state) {
      state['module'] = node.state;
    }
    for (const child of node.children) {
      state[child.module.name] = this.normalize(child);
    }
    return <State>state;
  }

  /**
   * Sets the state to a given, normalized state. This is the inverse of
   * `normalize`.
   * @param state The normalized state to reset this tree to.
   */
  denormalize(state: State, node: SpecificationNode = this.root) {
    if ('module' in state) {
      node.state = state['module'];
    }
    for (const child of node.children) {
      if (child.module.name in state) {
        this.denormalize(state[child.module.name], child);
      }
    }
  }
}
