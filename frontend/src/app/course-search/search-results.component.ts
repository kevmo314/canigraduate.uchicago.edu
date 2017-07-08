import {DayOfWeek} from 'app/day-of-week';
import {
  AfterViewInit,
  animate,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  state,
  style,
  transition,
  trigger
} from '@angular/core';
import {DatabaseService} from 'app/database/database.service';
import {Period} from 'app/period';
import {Section} from 'app/section';
import {Term} from 'app/term';
import {TranscriptService} from 'app/transcript/transcript.service';
import {environment} from 'environments/environment';
import {Store} from 'filnux';
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {Subject} from 'rxjs/Subject';
import {Memoize} from 'typescript-memoize';

import {CourseSearchState, ToggleShownAction} from './course-search.store';
import {FiltersState} from './filters/filters.store';

@Component({
  selector: 'cig-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultsComponent implements OnChanges {
  @Input() filters: FiltersState;
  @Input() start: number;
  @Input() end: number;
  @Input() store: Store<CourseSearchState>;
  @Output() countChange = new ReplaySubject<number>(1);

  results = new Subject<string[]>();

  constructor(private databaseService: DatabaseService,
              private transcriptService: TranscriptService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.filters && this.filters) {
      const subsets:
          Observable<Set<string>| ((_: Set<string>) => Set<String>)>[] = [];
      if (this.filters.periods.length ===
          environment.institution.periods.length) {
        subsets.push(this.databaseService.indexes('all').first());
      } else if (this.filters.periods.length > 0) {
        subsets.push(
            ...[Observable.forkJoin(this.filters.periods.map(period => {
                            return this.databaseService.indexes('periods/' +
                                                                period.name)
                                .first();
                          }))
                    .map(results => {
                      return results.reduce((x, y) => new Set<string>([
                                              ...Array.from(x.values()),
                                              ...Array.from(y.values())
                                            ]),
                                            new Set<string>());
                    })]);
      } else {
        return Observable.of([new Set<string>()]);
      }
      // Attempt broad course-based matching.
      if (this.filters.taken) {
        subsets.push(this.transcriptService.transcript.first().map(value => {
          const taken = new Set<string>(value.records.map(x => x.course));
          return (state: Set<string>) => {
            return new Set<string>(
                Array.from(state.values()).filter(x => !taken.has(x)));
          };
        }));
      }
      if (this.filters.query) {
        this.filters.query.toLocaleLowerCase()
            .split(' ')
            .map(q => q.trim())
            .filter(q => q.length > 0)
            .forEach(query => {
              subsets.push(
                  this.databaseService.indexes('fulltext/' + query).first());
            });
      }
      if (this.filters.instructors.size > 0) {
        this.filters.instructors.forEach(instructor => {
          subsets.push(this.databaseService.indexes('instructors/' + instructor)
                           .first());
        });
      }
      if (this.filters.departments.size > 0) {
        this.filters.departments.forEach(department => {
          subsets.push(this.databaseService.indexes('departments/' + department)
                           .first());
        });
      }
      if (this.filters.days !== DayOfWeek.EVERYDAY) {
        subsets.push(
            this.databaseService.scheduleIndex().first().map(schedules => {
              return (state: Set<string>) => {
                // Find the schedule blocks that are strictly intersected by the
                // filter.
                // These are courses that have at least one section that matches
                // the filter.
                const matchingCourses = new Set<string>();

                // Then calculate the intersection of this set of courses with
                // the provided state.
                return new Set(Array.from(state).filter(
                    course => matchingCourses.has(course)));
              };
            }));
      }
      Observable.forkJoin(subsets)
          .first()
          .map((ss: (Set<string>| ((_: Set<string>) => Set<string>))[]) => {
            let state = ss.shift() as Set<string>;
            for (const subset of ss) {
              if (subset instanceof Set) {
                state = new Set<string>(
                    Array.from(state.values()).filter(x => subset.has(x)));
              } else {
                state = subset(state);
              }
            }
            return state;
          })
          // Convert to array and sort.
          .map((results: Set<string>) => Array.from(results).sort())
          .subscribe(results => {
            this.results.next(results);
            this.countChange.next(results.length);
          });
    }
  }

  @Memoize()
  getShown(course: string): Observable<boolean> {
    return Observable.combineLatest(this.store.select(s => s.shown.has(course)),
                                    this.countChange)
        .map(([shown, count]) => shown || count === 1)
        .distinctUntilChanged();
  }

  toggleShown(course: string) {
    this.store.dispatch(new ToggleShownAction(course));
  }

  getCrosslists(id: string) {
    return this.databaseService.crosslists(id)
        .map(info => (info || []).join(', '));
  }
}
