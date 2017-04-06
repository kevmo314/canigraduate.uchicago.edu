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

export class State {
  days: DayOfWeek;
  periods: Period[];
  instructors: Set<string>;
  departments: Set<string>;
  core: boolean;
  prerequisites: boolean;
  taken: boolean;
  tested: boolean;
  constructor(previous: State) {
    this.days = previous.days;
    this.periods = [...previous.periods];
    this.instructors = new Set<string>(previous.instructors);
    this.departments = new Set<string>(previous.departments);
    this.core = previous.core;
    this.prerequisites = previous.prerequisites;
    this.taken = previous.taken;
    this.tested = previous.tested;
  }
}

class ToggleDayOfWeekAction implements Action {
  constructor(private dayOfWeek: DayOfWeek) {}
  reduce(state: State) {
    state = new State(state);
    state.days ^= this.dayOfWeek;
    return state;
  }
}

function toggleSet<T>(set: Set<T>, value: T) {
  set.has(value) ? set.delete(value) : set.add(value);
}

class TogglePeriodAction implements Action {
  constructor(private period: Period) {}
  reduce(state: State): State {
    state = new State(state);
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

class ToggleDepartmentAction implements Action {
  constructor(private department: string) {}
  reduce(state: State) {
    state = new State(state);
    toggleSet(state.departments, this.department);
    return state;
  }
}

class ToggleInstructorAction implements Action {
  constructor(private instructor: string) {}
  reduce(state: State) {
    state = new State(state);
    toggleSet(state.instructors, this.instructor);
    return state;
  }
}

class ToggleSimpleAction implements Action {
  constructor(private toggle: (State) => void) {}
  reduce(state: State) {
    state = new State(state);
    this.toggle(state);
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
  core: false
};

export const ACTIONS = [
  ToggleDayOfWeekAction, TogglePeriodAction, ToggleDepartmentAction,
  ToggleInstructorAction, ToggleSimpleAction
];