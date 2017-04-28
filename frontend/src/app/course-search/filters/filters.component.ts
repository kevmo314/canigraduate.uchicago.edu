import {AfterViewInit, ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Pipe, PipeTransform} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MdButtonToggleChange} from '@angular/material';
import {DatabaseService} from 'app/database/database.service';
import {Period} from 'app/period';
import {environment} from 'environments/environment';
import {AssignAction, SelectValue, Store} from 'filnux';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';

import {ACTIONS, DayOfWeek, FiltersState, SetQueryAction} from './filters.store';

@Component({
  selector: 'cig-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss'],
  //  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FiltersComponent {
  store = new Store<FiltersState>({
            initialState: new FiltersState()
          }).addActions(ACTIONS);
  days: Observable<DayOfWeek>;
  periods: Observable<Period[]>;
  instructors: Observable<Set<string>>;
  departments: Observable<Set<string>>;
  @SelectValue(this.store, s => s.query, query => ({query})) query: string;
  institution = environment.institution;
  DayOfWeek = DayOfWeek;

  constructor(private databaseService: DatabaseService) {
    this.days = this.store.select(s => s.days);
    this.periods = this.store.select(s => s.periods);
    this.instructors = this.store.select(s => s.instructors);
    this.departments = this.store.select(s => s.departments);
    this.query = this.store.select(s => s.query);
  }

  setDays(days: DayOfWeek) {
    this.store.dispatch(new AssignAction<FiltersState>({days}));
  }

  setPeriods(periods: Period[]) {
    this.store.dispatch(new AssignAction<FiltersState>({periods}));
  }

  setQuery(query: string) {
    this.store.dispatch(new AssignAction<FiltersState>({query}));
  }
}
