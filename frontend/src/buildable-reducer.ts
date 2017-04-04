import {Type} from '@angular/core';
import {Action, Reducer} from 'filnux/store_module';

import {ToggleDayOfWeekAction} from './app/course-search/filters/filters.store';

export abstract class BuildableAction<T> implements Action {
  get type(): string {
    return this.constructor.name;
  }
  abstract reduce(state: T);
}

interface StaticAction<T, A> extends Type<A> {
  prototype: {type?: string; reduce(state: T): T};
}

export class ReducerBuilder<T> {
  private actionTypes: StaticAction<T, BuildableAction<T>>[] = [];
  constructor(private initialState: T) {}

  add<P>(...actionTypes: StaticAction<T, BuildableAction<T>>[]) {
    this.actionTypes.push(...actionTypes);
    return this;
  }

  build(): Reducer<T, Action> {
    return (state: T, action: Action): T => {
      state = state || this.initialState;
      for (const actionType of this.actionTypes) {
        if (action instanceof actionType) {
          return action.reduce(state);
        }
      }
      return state;
    };
  }
}
