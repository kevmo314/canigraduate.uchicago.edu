import { DatabaseService } from '../database/database.service';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

const UNKNOWN_COURSE_NAME = 'Unknown';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cig-course-name',
  template: `<span [class.unknown]="(name | async) == '${UNKNOWN_COURSE_NAME}'">{{name | async}}</span>`,
  styles: ['.unknown { font-style: italic; opacity: 0.54; }']
})
export class CourseNameComponent {
  @Input() course: string;
  constructor(private databaseService: DatabaseService) {}

  get name() {
    return this.databaseService.courseInfo(this.course)
        .map(x => (x && x.name) ? x.name : UNKNOWN_COURSE_NAME);
  }
}
