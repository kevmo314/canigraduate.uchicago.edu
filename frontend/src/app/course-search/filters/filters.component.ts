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
  days = this.store.select(s => s.days);
  periods = this.store.select(s => s.periods);
  instructors = this.store.select(s => s.instructors);
  departments = this.store.select(s => s.departments);
  query = this.store.select(s => s.query);
  institution = environment.institution;
  DayOfWeek = DayOfWeek;

  constructor(private databaseService: DatabaseService) {}

  setDays(days: DayOfWeek) {
    this.store.dispatch(new AssignAction<FiltersState>({days}));
  }

  setPeriods(periods: Period[]) {
    this.store.dispatch(new AssignAction<FiltersState>({periods}));
  }

  setQuery(query: string) {
    this.store.dispatch(new AssignAction<FiltersState>({query}));
  }

  setDepartments(departments: Set<string>) {
    this.store.dispatch(new AssignAction<FiltersState>({departments}));
  }

  setInstructors(instructors: Set<string>) {
    this.store.dispatch(new AssignAction<FiltersState>({instructors}));
  }
}
