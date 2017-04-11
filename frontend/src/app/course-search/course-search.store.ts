import {Injectable} from '@angular/core';
import {Period} from 'app/period';
import {environment} from 'environments/environment';
import {Action} from 'filnux';

export class CourseSearchState {
  shown: Set<string>;
  constructor(previous: CourseSearchState) {
    this.shown = new Set<string>(previous.shown);
  }
}

export class ToggleShownAction implements Action {
  constructor(private course: string) {}
  reduce(state: CourseSearchState): CourseSearchState {
    state = new CourseSearchState(state);
    state.shown.has(this.course) ? state.shown.delete(this.course) : state.shown.add(this.course);
    return state;
  }
}

export const INITIAL_STATE = {
  shown: new Set()
};

export const ACTIONS = [
  ToggleShownAction
];