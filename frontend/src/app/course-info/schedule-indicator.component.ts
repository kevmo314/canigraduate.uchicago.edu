import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {DatabaseService} from 'app/database/database.service';
import {DayOfWeek} from 'app/day-of-week';
import {Memoize} from 'typescript-memoize';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cig-schedule-indicator',
  template:
      `<span mdTooltip="{{tooltip | async}}" [ngStyle]="{'background-color': color}">` +
      `<ng-content></ng-content>` +
      `</span>`,
  styleUrls: ['./schedule-indicator.component.scss']
})
export class ScheduleIndicatorComponent {
  @Input() schedule: [number, number][];
  @Input() dayOfWeek: DayOfWeek;

  get color() {
    if (this.schedule[0][0] < 10 * 60 + 30) {
      // Morning
      return '#4caf50';
    } else if (this.schedule[0][0] < 13 * 60 + 30) {
      // Around noon
      return '#2196f3';
    } else if (this.schedule[0][0] < 15 * 60) {
      // Early afternoon
      return '#ffc107';
    } else if (this.schedule[0][0] < 16 * 60 + 30) {
      // Late afternoon
      return '#ff5252';
    } else {
      // Evening
      return '#607d8b';
    }
  }

  get tooltip() {
    return this.schedule.map(interval => this.intervalToString(interval))
        .join(', ');
  }

  private intervalToString(interval: [number, number]) {
    return interval.map(time => this.timeToString(time)).join('-');
  }

  private timeToString(time: number) {
    const hour = time / 60;
    const minute = time % 60;
    if (hour < 12) {
      return `${hour}:${minute}a`;
    } else {
      return `${hour - 12}:${minute}p`;
    }
  }
}
