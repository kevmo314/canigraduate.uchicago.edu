import {AfterViewInit, animate, ChangeDetectionStrategy, Component, EventEmitter, Input, Output, state, style, transition, trigger} from '@angular/core';
import {DatabaseService} from 'app/database/database.service';
import {Period} from 'app/period';
import {Section} from 'app/section';
import {Term} from 'app/term';
import {environment} from 'environments/environment';
import {Observable} from 'rxjs/Observable';

import {FiltersState} from './filters/filters.store';

@Component({
  selector: 'cig-search-result',
  templateUrl: './search-result.component.html',
  styleUrls: ['./search-result.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [trigger(
      'toggle',
      [
        state('false', style({height: '0'})),
        state('true', style({height: '*'})),
        transition('false => true', animate('300ms ease-in')),
        transition('true => false', animate('300ms ease-out'))
      ])],
})
export class SearchResultComponent implements AfterViewInit {
  @Input() course: string;
  @Input() filters: FiltersState;
  @Input() expanded: boolean;
  @Input() crosslists: string;
  @Output() expandedChange = new EventEmitter<void>();
  sections: Observable<Section[]>;
  periods: Period[] = environment.institution.periods;

  constructor(private databaseService: DatabaseService) {}

  ngAfterViewInit() {
    if (!this.course) {
      throw new Error('course parameter must be specified');
    }
    this.sections =
        this.databaseService.schedules(this.course).map(schedules => {
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
