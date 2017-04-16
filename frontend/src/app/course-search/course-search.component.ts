import {Component, OnInit, Pipe, PipeTransform} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MdButtonToggleChange} from '@angular/material';
import {DatabaseService} from 'app/database/database.service';
import {Period} from 'app/period';
import {Section} from 'app/section';
import {Term} from 'app/term';
import {environment} from 'environments/environment';
import {Store} from 'filnux';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {Memoize} from 'typescript-memoize';

import {CourseSearchModule} from './course-search.module';
import {CourseSearchState, ToggleShownAction} from './course-search.store';
import {FiltersModule} from './filters/filters.module';
import {FiltersState} from './filters/filters.store';

@Component({
  selector: 'cig-course-search',
  templateUrl: './course-search.component.html',
  styleUrls: ['./course-search.component.scss']
})
export class CourseSearchComponent {
  page = 0;
  queryTime = 0;

  results: Observable<string[]>;

  constructor(private databaseService: DatabaseService, private store: Store) {
    this.results =
        Observable
            .combineLatest(
                this.store.select<FiltersState>(FiltersModule),
                this.databaseService.indexes())
            .debounceTime(150)
            .map(([filters, indexes]: [FiltersState, any]) => {
              let matches = new Set<string>(indexes['all']);
              // Attempt broad course-based matching.
              if (filters.departments.size > 0) {
                // Remove any matches that do not appear in the requested
                // departments.
                const departmentMatches = new Set<string>();
                filters.departments.forEach(department => {
                  for (const course of indexes['departments'][department]) {
                    departmentMatches.add(course);
                  }
                });
                matches = this.intersect(matches, departmentMatches);
              }
              // Convert matches to corresponding course objects.
              return Array.from(matches);
            });
  }

  @Memoize()
  getShown(course: string): Observable<boolean> {
    return this.store.select<CourseSearchState>(() => CourseSearchModule)
        .map((s: CourseSearchState) => s.shown.has(course));
  }

  toggleShown(course: string) {
    this.store.dispatch(new ToggleShownAction(course));
  }

  private intersect<T>(a: Set<T>, b: Set<T>): Set<T> {
    return new Set<T>(Array.from(a.values()).filter(x => b.has(x)));
  }

  @Memoize()
  getSections(course: string): Observable<Section[]> {
    return Observable
        .combineLatest(
            this.store.select<FiltersState>(FiltersModule),
            this.databaseService.schedules(course))
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
    return values.map(x => x.length);
  }
}