import { DatabaseService } from '../database/database.service';
import { Component, Input, ChangeDetectionStrategy, HostBinding, AfterViewInit } from '@angular/core';

const UNKNOWN_COURSE_NAME = 'Unknown';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cig-course-name',
  template: `{{name | async}}`,
  styleUrls: ['./course-name.component.scss']
})
export class CourseNameComponent implements AfterViewInit {
  @HostBinding('class.unknown') unknown = false;
  @Input() course: string;

  constructor(private databaseService: DatabaseService) {  }

  ngAfterViewInit() {
    this.name.subscribe(name => this.unknown = (name === UNKNOWN_COURSE_NAME));
  }

  get name() {
    return this.databaseService.name(this.course)
        .map(name => name || UNKNOWN_COURSE_NAME);
  }
}
