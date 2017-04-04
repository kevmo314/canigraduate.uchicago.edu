import {AfterViewInit, ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Pipe, PipeTransform} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MdButtonToggleChange} from '@angular/material';
import {DatabaseService} from 'app/database/database.service';
import {Filters} from 'app/filters';
import {Period} from 'app/period';
import {environment} from 'environments/environment';
import {Store} from 'filnux/store';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';

import {FiltersModule} from './filters.module';
import {DayOfWeek, State, ToggleDayOfWeekAction, ToggleDepartmentAction, ToggleInstructorAction, TogglePeriodAction, ToggleSimpleAction} from './filters.store';

@Component({
  selector: 'cig-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss'],
  //  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FiltersComponent {
  private days: Observable<DayOfWeek>;
  private periods: Observable<Period[]>;
  instructors: Observable<Set<string>>;
  departments: Observable<Set<string>>;
  public institution = environment.institution;
  public DayOfWeek = DayOfWeek;

  constructor(
      private store: Store<State>, private databaseService: DatabaseService) {
    this.days = this.store.select(FiltersModule).map(s => s.days);
    this.periods = this.store.select(FiltersModule).map(s => s.periods);
    this.instructors = this.store.select(FiltersModule).map(s => s.instructors);
    this.departments = this.store.select(FiltersModule).map(s => s.departments);
  }

  getDayOfWeek(dayOfWeek: DayOfWeek) {
    return this.days.map(x => x & dayOfWeek);
  }
  toggleDayOfWeek(dayOfWeek: DayOfWeek) {
    this.store.dispatch(new ToggleDayOfWeekAction(dayOfWeek));
  }
  getPeriod(period: Period) {
    return this.periods.map(x => Boolean(x.find(y => y.name === period.name)));
  }
  togglePeriod(period: Period) {
    this.store.dispatch(new TogglePeriodAction(period));
  }
  get allDepartments() {
    return this.databaseService.departments.map(x => x.sort());
  }
  toggleDepartment(department) {
    this.store.dispatch(new ToggleDepartmentAction(department));
  }
  get allInstructors() {
    return this.databaseService.instructors.map(x => x.sort());
  }
  toggleInstructor(instructor) {
    this.store.dispatch(new ToggleInstructorAction(instructor));
  }
  toggleTaken() {
    this.store.dispatch(new ToggleSimpleAction(s => s.taken = !s.taken));
  }
  toggleTested() {
    this.store.dispatch(new ToggleSimpleAction(s => s.tested = !s.tested));
  }
  togglePrerequisites() {
    this.store.dispatch(
        new ToggleSimpleAction(s => s.prerequisites = !s.prerequisites));
  }
  toggleCore() {
    this.store.dispatch(new ToggleSimpleAction(s => s.core = !s.core));
  }
}

@Pipe({name: 'remove'})
export class RemovePipe implements PipeTransform {
  transform(values: Observable<string[]>, remove: Observable<Set<string>>):
      Observable<string[]> {
    return values.combineLatest(remove, (v, r) => v.filter(x => !r.has(x)));
  }
}

@Pipe({name: 'search'})
export class SearchPipe implements PipeTransform {
  transform(values: Observable<string[]>, query: string): Observable<string[]> {
    return values.map(
        v => v.filter(x => x.toLowerCase().indexOf(query.toLowerCase()) > -1));
  }
}