import { DatabaseService } from '../database/database.service';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

const UNKNOWN_COURSE_NAME = 'Unknown';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cig-course-name',
  templateUrl: './course-name.component.html',
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
