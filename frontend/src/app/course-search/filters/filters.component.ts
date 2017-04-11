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
import {DayOfWeek, FiltersState, SetQueryAction} from './filters.store';

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

  constructor(
      private store: Store, private databaseService: DatabaseService) {
    this.days = Observable.from(this.store.select<FiltersState>(FiltersModule).map(s => s.days));
    this.periods = Observable.from(this.store.select<FiltersState>(FiltersModule).map(s => s.periods));
    this.instructors = Observable.from(this.store.select<FiltersState>(FiltersModule).map(s => s.instructors));
    this.departments = Observable.from(this.store.select<FiltersState>(FiltersModule).map(s => s.departments));
    this.query = Observable.from(this.store.select<FiltersState>(FiltersModule).map(s => s.query));
  }

  setQuery(value: string) {
    this.store.dispatch(new SetQueryAction(value));
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