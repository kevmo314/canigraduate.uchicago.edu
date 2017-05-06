import {Injectable} from '@angular/core';
import {Period} from 'app/period';
import {environment} from 'environments/environment';
import {Action} from 'filnux';

export class CourseSearchState {
  shown?: Set<string> = new Set<string>();
  page? = 0;
  constructor(previous?: CourseSearchState) {
    if (previous) {
      this.shown = new Set<string>(previous.shown);
      this.page = previous.page;
    }
  }
}

export class ToggleShownAction implements Action<CourseSearchState> {
  type = 'Toggle shown action'
  constructor(private course: string) {
    this.type = 'Toggle ' + course;
  }
  reduce(state: CourseSearchState): CourseSearchState {
    state = new CourseSearchState(state);
    state.shown.has(this.course) ? state.shown.delete(this.course) :
                                   state.shown.add(this.course);
    return state;
  }
}

export const ACTIONS = [ToggleShownAction];
