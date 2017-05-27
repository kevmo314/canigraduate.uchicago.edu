import {AfterViewInit, ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {Activity} from 'app/activity';
import {DayOfWeek} from 'app/day-of-week';
import {Evaluation} from 'app/evaluation';
import {Section} from 'app/section';
import {Observable} from 'rxjs/Observable';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cig-section',
  templateUrl: 'section.component.html',
  styleUrls: ['./section.component.scss']
})
export class SectionComponent implements AfterViewInit {
  @Input() evaluation: Evaluation;
  @Input() section: Section;

  public DayOfWeek = DayOfWeek;

  constructor() {}

  ngAfterViewInit() {}

  get instructors() {
    return this.section.primaries.map(primary => primary.instructors)
        .reduce((x, y) => x.concat(y), []);
  }

  get enrollment() {
    return this.section.enrollment[0];
  }

  get enrollmentLimit() {
    const limit = parseInt(this.section.enrollment[1], 10);
    return isNaN(limit) ? '∞' : limit;
  }
}
