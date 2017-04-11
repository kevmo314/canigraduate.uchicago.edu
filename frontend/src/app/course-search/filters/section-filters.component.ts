import {AfterViewInit, ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Pipe, PipeTransform, Input} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MdButtonToggleChange} from '@angular/material';
import {DatabaseService} from 'app/database/database.service';
import {Period} from 'app/period';
import {environment} from 'environments/environment';
import {Store} from 'filnux';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';

import {FiltersModule} from './filters.module';
import {DayOfWeek, FiltersState, ToggleDayOfWeekAction, ToggleDepartmentAction, ToggleInstructorAction, TogglePeriodAction, ToggleSimpleAction} from './filters.store';

@Component({
  selector: 'cig-section-filters',
  templateUrl: './section-filters.component.html',
  styleUrls: ['./section-filters.component.scss'],
 // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionFiltersComponent {
  @Input() days: DayOfWeek;
  @Input() periods: Period[];
  @Input() instructors: Set<string>;
  @Input() departments: Set<string>;
  public institution = environment.institution;
  public DayOfWeek = DayOfWeek;

  constructor(private store: Store, private databaseService: DatabaseService) {
  }

  getDayOfWeek(dayOfWeek: DayOfWeek) {
    return this.days & dayOfWeek;
  }
  toggleDayOfWeek(dayOfWeek: DayOfWeek) {
    this.store.dispatch(new ToggleDayOfWeekAction(dayOfWeek));
  }
  getPeriod(period: Period) {
    return Boolean(this.periods.find(y => y.name === period.name));
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
  /*
  private _indexesCache;

  courses(filters: Filters): Promise<string[]> {
    // Return all the course id's that match a specific filter set.
    return (this._indexesCache ? Observable.of(this._indexesCache) :
                                 this.angularFire.database.object('indexes')
                                     .map(indexes => {
                                       // This seems to yield much better
                                       // performance than caching the
                                       // underlying observable.
                                       return this._indexesCache = indexes;
                                     })
                                     .first())
        .map(indexes => {
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
          return Array.from(matches).sort();
        })
        // Convert to a promise because we do not surface future updates for
        // performance reasons.
        .toPromise();
  }
  */
}

@Pipe({name: 'remove'})
export class RemovePipe implements PipeTransform {
  transform(values: Observable<string[]>, remove: Set<string>):
      Observable<string[]> {
    return values.map(v => v.filter(x => !remove.has(x)));
  }
}

@Pipe({name: 'search'})
export class SearchPipe implements PipeTransform {
  transform(values: Observable<string[]>, query: string): Observable<string[]> {
    return values.map(
        v => v.filter(x => x.toLowerCase().indexOf(query.toLowerCase()) > -1));
  }
}