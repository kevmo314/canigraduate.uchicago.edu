import {AfterViewInit, ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {Section} from 'app/section';
import {Observable} from 'rxjs/Observable';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cig-section',
  templateUrl: 'section.component.html',
  styleUrls: ['./section.component.scss']
})
export class SectionComponent implements AfterViewInit {
  @Input() section: Section;

  constructor() {}

  ngAfterViewInit() {}

  get instructors() {
    return this.section.primaries.map(primary => primary.instructors)
        .reduce((x, y) => x.concat(y), []);
  }
}
