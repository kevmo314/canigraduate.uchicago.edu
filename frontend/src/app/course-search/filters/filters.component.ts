import {AfterViewInit, ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Pipe, PipeTransform} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MdButtonToggleChange} from '@angular/material';
import {DatabaseService} from 'app/database/database.service';
import {Period} from 'app/period';
import {environment} from 'environments/environment';
import {Store} from 'filnux';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';

import {FiltersModule} from './filters.module';
import {ACTIONS, DayOfWeek, FiltersState, SetQueryAction} from './filters.store';

@Component({
  selector: 'cig-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss'],
  //  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FiltersComponent {
  days: Observable<DayOfWeek>;
  periods: Observable<Period[]>;
  instructors: Observable<Set<string>>;
  departments: Observable<Set<string>>;
  query: Observable<string>;
  institution = environment.institution;
  DayOfWeek = DayOfWeek;
  store: Store<FiltersState> = null;

  constructor(private databaseService: DatabaseService) {
    this.store = new Store<FiltersState>({
                   context: FiltersModule,
                   initialState: new FiltersState()
                 }).addActions(ACTIONS);
    this.days = this.store.select(s => s.days);
    this.periods = this.store.select(s => s.periods);
    this.instructors = this.store.select(s => s.instructors);
    this.departments = this.store.select(s => s.departments).map(d => {
      debugger;
      return d;
    });
    this.query = this.store.select(s => s.query);
  }

  setQuery(value: string) {
    this.store.dispatch(new SetQueryAction(value));
  }
}
