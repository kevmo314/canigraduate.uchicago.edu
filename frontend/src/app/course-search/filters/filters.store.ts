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
  days?: DayOfWeek = DayOfWeek.MONDAY | DayOfWeek.TUESDAY |
      DayOfWeek.WEDNESDAY | DayOfWeek.THURSDAY | DayOfWeek.FRIDAY;
  periods?: Period[] = [...environment.institution.periods];
  instructors?: Set<string> = new Set();
  departments?: Set<string> = new Set();
  core?: boolean = false;
  prerequisites?: boolean = false;
  taken?: boolean = false;
  tested?: boolean = false;
  query?: string = '';
  constructor(previous?: FiltersState) {
    if (previous) {
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
}

export class ToggleDayOfWeekAction extends Action<FiltersState> {
  constructor(private dayOfWeek: DayOfWeek) {
    super();
  }
  reduce(state: FiltersState) {
    state = new FiltersState(state);
    state.days ^= this.dayOfWeek;
    return state;
  }
}

function toggleSet<T>(set: Set<T>, value: T) {
  set.has(value) ? set.delete(value) : set.add(value);
}

export class TogglePeriodAction extends Action<FiltersState> {
  constructor(private period: Period) {
    super();
  }
  reduce(state: FiltersState): FiltersState {
    state = new FiltersState(state);
    return state;
  }
}

export class ToggleDepartmentAction extends Action<FiltersState> {
  constructor(private department: string) {
    super();
  }
  reduce(state: FiltersState) {
    state = new FiltersState(state);
    toggleSet(state.departments, this.department);
    return state;
  }
}

export class ToggleInstructorAction extends Action<FiltersState> {
  constructor(private instructor: string) {
    super();
  }
  reduce(state: FiltersState) {
    state = new FiltersState(state);
    toggleSet(state.instructors, this.instructor);
    return state;
  }
}

export class ToggleSimpleAction extends Action<FiltersState> {
  constructor(private toggle: (State) => void) {
    super();
  }
  reduce(state: FiltersState) {
    state = new FiltersState(state);
    this.toggle(state);
    return state;
  }
}

export class SetQueryAction extends Action<FiltersState> {
  constructor(private query: string) {
    super();
  }
  reduce(state: FiltersState) {
    state = new FiltersState(state);
    state.query = this.query;
    return state;
  }
}

export const ACTIONS = [
  ToggleDayOfWeekAction, TogglePeriodAction, ToggleDepartmentAction,
  ToggleInstructorAction, ToggleSimpleAction, SetQueryAction
];