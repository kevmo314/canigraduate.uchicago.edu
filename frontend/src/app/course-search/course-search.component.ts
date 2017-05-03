import {AfterViewInit, Component, OnInit, Pipe, PipeTransform, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MdButtonToggleChange} from '@angular/material';
import {DatabaseService} from 'app/database/database.service';
import {Period} from 'app/period';
import {Section} from 'app/section';
import {Term} from 'app/term';
import {environment} from 'environments/environment';
import {AssignAction, Store} from 'filnux';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {Memoize} from 'typescript-memoize';

import {CourseSearchModule} from './course-search.module';
import {ACTIONS, CourseSearchState, ToggleShownAction} from './course-search.store';
import {FiltersComponent} from './filters/filters.component';
import {FiltersModule} from './filters/filters.module';
import {FiltersState} from './filters/filters.store';

@Component({
  selector: 'cig-course-search',
  templateUrl: './course-search.component.html',
  styleUrls: ['./course-search.component.scss']
})
export class CourseSearchComponent implements AfterViewInit {
  page: Observable<number>;
  queryTime = 0;
  store: any;

  @ViewChild(FiltersComponent) filters: FiltersComponent;

  results: Observable<string[]>;

  constructor(private databaseService: DatabaseService) {
    this.store = new Store<CourseSearchState>({
                   initialState: new CourseSearchState()
                 }).addActions(ACTIONS);
  }

  ngAfterViewInit() {
    this.page = this.store.select(s => s.page);
    this.results =
                this.filters.store.select(x => x)
            .debounceTime(150)
            .flatMap((filters: FiltersState) => {
              const subsets = [];
              // Attempt broad course-based matching.
              if (filters.departments.size > 0) {
                // Remove any matches that do not appear in the requested
                // departments.
                subsets.push(...Array.from(filters.departments).map(department => {
                  return this.databaseService.indexes('departments/' + department).first();
                }));
              }
              if (filters.instructors.size > 0) {
                subsets.push(...Array.from(filters.instructors).map(instructor => {
                  return this.databaseService.indexes('instructors/' + instructor).first();
                }));
              }
              if (filters.query) {
                subsets.push(...filters.query.split(' ').map(query => {
                  return this.databaseService.indexes('fulltext/' + filters.query).first();
                }));
              }
              return Observable.forkJoin(subsets);
            });
  }

  @Memoize()
  getShown(course: string): Observable<boolean> {
    return this.store.select(s => s.shown.has(course));
  }

  toggleShown(course: string) {
    this.store.dispatch(new ToggleShownAction(course));
  }

  setPage(page: number) {
    this.store.dispatch(new AssignAction<CourseSearchState>({page}));
  }

  private intersect<T>(a: Set<T>, b: Set<T>): Set<T> {
    return new Set<T>(Array.from(a.values()).filter(x => b.has(x)));
  }

  @Memoize()
  getSections(course: string): Observable<Section[]> {
    return Observable
        .combineLatest(
            this.store.select(x => x), this.databaseService.schedules(course))
        .debounceTime(150)
        .map(([filters, schedules]) => {
          const results = [];
          for (const year of Object.keys(schedules)) {
            for (const period of (
                     schedules[year] ? Object.keys(schedules[year]) : [])) {
              for (const sectionId of (
                       schedules[year][period] ?
                           Object.keys(schedules[year][period]) :
                           [])) {
                if (schedules[year][period][sectionId]) {
                  results.push(
                      Object.assign(
                          {id: sectionId},
                          schedules[year][period][sectionId]) as Section);
                }
              }
            }
          }
          return results.sort(
              (a, b) => -Term.compare(a.term, b.term) || -(a.id < b.id) ||
                  +(a.id !== b.id));
        });
  }
}

@Pipe({name: 'count'})
export class CountPipe implements PipeTransform {
  transform(values: Observable<any[]>): Observable<number> {
    return values ? values.map(x => x.length) : Observable.of(0);
  }
}