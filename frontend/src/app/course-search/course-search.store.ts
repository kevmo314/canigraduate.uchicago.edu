import {Injectable} from '@angular/core';
import {Period} from 'app/period';
import {environment} from 'environments/environment';
import {Action} from 'filnux';

export class CourseSearchState {
  shown?: Set<string> = new Set<string>();
  page? = 0;
  resultsPerPage? = 10;
  constructor(previous?: CourseSearchState) {
    if (previous) {
      this.shown = new Set<string>(previous.shown);
      this.page = previous.page;
      this.resultsPerPage = previous.resultsPerPage;
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
