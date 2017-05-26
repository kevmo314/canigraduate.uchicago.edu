import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {DatabaseService} from 'app/database/database.service';
import {Memoize} from 'typescript-memoize';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cig-term-offer-indicator',
  template: `<span mdTooltip="{{tooltip | async}}" ` +
      `[ngStyle]="{'background-color': (year | async) ? color : null, 'color': (year | async) ? 'white' : null}">` +
      `<ng-content></ng-content>` +
      `</span>`,
  styleUrls: ['./term-offer-indicator.component.scss']
})
export class TermOfferIndicatorComponent {
  @Input() course: string;
  @Input() color: string;
  @Input() period: string;

  constructor(private databaseService: DatabaseService) {}

  get tooltip() {
    return this.year.map(year => year && (this.period + ' ' + year));
  }

  @Memoize()
  get year() {
    return this.databaseService.schedules(this.course).map(data => {
      const years = Object.keys(data)
                        .filter(x => x.charAt(0) !== '$')
                        .sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
      for (const year of years) {
        if (this.period in data[year]) {
          return year;
        }
      }
    });
  }
}
