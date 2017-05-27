import {ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges, SimpleChanges} from '@angular/core';
import {DatabaseService} from 'app/database/database.service';
import {DayOfWeek} from 'app/day-of-week';
import {Memoize} from 'typescript-memoize';

const DAYS_OF_WEEK = ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cig-schedule-indicator',
  template: `<span *ngFor="let component of scheduleComponents" ` +
      `[ngStyle]="{'background-color': getBackgroundColor(component.times)}">` +
      `{{component.days.join(' ')}} {{intervalToString(component.times)}}` +
      `</span>`,
  styleUrls: ['./schedule-indicator.component.scss']
})
export class ScheduleIndicatorComponent implements OnChanges {
  @Input() schedule: [number, number][];

  scheduleComponents: {times: [number, number], days: string[]}[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes.schedule && this.schedule) {
      this.scheduleComponents =
          this.schedule.sort((a, b) => a[0] - b[0]).reduce((state, current) => {
            const times = current.map(x => x % 1440);
            const day = DAYS_OF_WEEK[(current[0] - times[0]) / 1440];
            for (const record of state) {
              if (record.times[0] === times[0] &&
                  record.times[1] === times[1]) {
                record.days.push(day);
                return state;
              }
            }
            state.push({times, days: [day]});
            return state;
          }, [] as {times: [number, number], days: string[]}[]);
    }
  }

  get tooltip() {
    return this.schedule.map(interval => this.intervalToString(interval))
        .join(', ');
  }

  getBackgroundColor(interval: [number, number]) {
    if (interval[0] < 10 * 60 + 30) {
      // Morning
      return '#4caf50';
    } else if (interval[0] < 13 * 60 + 30) {
      // Around noon
      return '#2196f3';
    } else if (interval[0] < 15 * 60) {
      // Early afternoon
      return '#ffc107';
    } else if (interval[0] < 16 * 60 + 30) {
      // Late afternoon
      return '#ff5252';
    } else {
      // Evening
      return '#607d8b';
    }
  }

  intervalToString(interval: [number, number]) {
    return interval.map((time, i) => this.timeToString(time, i > 0)).join('-');
  }

  private timeToString(time: number, showPeriod: boolean) {
    const minute = time % 60;
    const hour = (time - minute) / 60;
    return (hour % 12 ? hour % 12 : 12) +
        (minute < 10 ? `:0${minute}` : `:${minute}`) +
        (showPeriod ? (hour < 12 ? 'a' : 'p') : '');
  }
}
