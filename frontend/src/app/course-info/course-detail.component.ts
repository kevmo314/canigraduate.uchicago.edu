import { DatabaseService } from 'app/database/database.service';
import { Filters } from 'app/filters';
import { Component, Input, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cig-course-detail',
  template: `{{course}}`,
  styleUrls: ['./course-detail.component.scss']
})
export class CourseDetailComponent implements AfterViewInit {
  @Input() course: string;
  @Input() filters: Filters;

  constructor(private databaseService: DatabaseService) { }

  ngAfterViewInit() {
  }
}
