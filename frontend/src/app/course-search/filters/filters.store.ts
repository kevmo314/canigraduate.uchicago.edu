import {Injectable} from '@angular/core';
import {Period} from 'app/period';
import {environment} from 'environments/environment';
import {Action} from 'filnux';

export enum DayOfWeek {
  SUNDAY = 1 << 0,
  MONDAY = 1 << 1,
  TUESDAY = 1 << 2,
  WEDNESDAY = 1 << 3,
  THURSDAY = 1 << 4,
  FRIDAY = 1 << 5,
  SATURDAY = 1 << 6
}

export class FiltersState {
  days: DayOfWeek;
  periods: Period[];
  instructors: Set<string>;
  departments: Set<string>;
  core: boolean;
  prerequisites: boolean;
  taken: boolean;
  tested: boolean;
  query: string;
  constructor(previous: FiltersState) {
    this.days = previous.days;
    this.periods = [...previous.periods];
    this.instructors = new Set<string>(previous.instructors);
    this.departments = new Set<string>(previous.departments);
    this.core = previous.core;
    this.prerequisites = previous.prerequisites;
    this.taken = previous.taken;
    this.tested = previous.tested;
    this.query = previous.query;
  }
}

export class ToggleDayOfWeekAction implements Action {
  constructor(private dayOfWeek: DayOfWeek) {}
  reduce(state: FiltersState) {
    state = new FiltersState(state);
    state.days ^= this.dayOfWeek;
    return state;
  }
}

function toggleSet<T>(set: Set<T>, value: T) {
  set.has(value) ? set.delete(value) : set.add(value);
}

export class TogglePeriodAction implements Action {
  constructor(private period: Period) {}
  reduce(state: FiltersState): FiltersState {
    state = new FiltersState(state);
    const index =
        state.periods.findIndex(period => period.name === this.period.name);
    if (index >= 0) {
      state.periods.splice(index, 1);
    } else {
      state.periods.push(this.period);
    }
    return state;
  }
}

export class ToggleDepartmentAction implements Action {
  constructor(private department: string) {}
  reduce(state: FiltersState) {
    state = new FiltersState(state);
    toggleSet(state.departments, this.department);
    return state;
  }
}

export class ToggleInstructorAction implements Action {
  constructor(private instructor: string) {}
  reduce(state: FiltersState) {
    state = new FiltersState(state);
    toggleSet(state.instructors, this.instructor);
    return state;
  }
}

export class ToggleSimpleAction implements Action {
  constructor(private toggle: (State) => void) {}
  reduce(state: FiltersState) {
    state = new FiltersState(state);
    this.toggle(state);
    return state;
  }
}

export class SetQueryAction implements Action {
  constructor(private query: string) { }
  reduce(state: FiltersState) {
    state = new FiltersState(state);
    state.query = this.query;
    return state;
  }
}

export const INITIAL_STATE = {
  days: DayOfWeek.MONDAY | DayOfWeek.TUESDAY | DayOfWeek.WEDNESDAY |
      DayOfWeek.THURSDAY | DayOfWeek.FRIDAY,
  periods: [...environment.institution.periods],
  instructors: new Set(),
  departments: new Set(),
  taken: false,
  tested: false,
  prerequisites: false,
  core: false,
  query: ''
};

export const ACTIONS = [
  ToggleDayOfWeekAction, TogglePeriodAction, ToggleDepartmentAction,
  ToggleInstructorAction, ToggleSimpleAction, SetQueryAction
];