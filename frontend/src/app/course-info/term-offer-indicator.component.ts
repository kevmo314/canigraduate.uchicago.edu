import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {DatabaseService} from 'app/database/database.service';
import {Period} from 'app/period';
import {environment} from 'environments/environment';
import {Observable} from 'rxjs/Observable';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cig-term-offer-indicator',
  template: `<span mdTooltip="{{tooltip | async}}" ` +
      `[ngStyle]="{'background-color': (year | async) ? period.color : null, 'color': (year | async) ? 'white' : null}">` +
      `<ng-content></ng-content>` +
      `</span>`,
  styleUrls: ['./term-offer-indicator.component.scss']
})
export class TermOfferIndicatorComponent implements OnChanges {
  @Input() course: string;
  @Input() period: Period;
  @Input() disabled: boolean;
  year: Observable<number>;
  tooltip: Observable<string>;

  constructor(private databaseService: DatabaseService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.disabled) {
      this.year = Observable.of(0);
    } else {
      this.year = this.databaseService.offerings(this.course).map(offerings => {
        for (const offering of offerings) {
          if (environment.institution.getPeriod(offering) === this.period) {
            return environment.institution.getYear(offering);
          }
        }
      });
    }
    this.tooltip =
        this.year.map(year => year && (this.period.name + ' ' + year));
  }
}
