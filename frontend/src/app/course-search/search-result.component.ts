import { CourseInfoService } from '../course-info/course-info.service';
import { Component, Input, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';
import { Filters, DayOfWeek } from './filters';

@Component({
  selector: 'cig-search-result',
  templateUrl: './search-result.component.html',
  styleUrls: ['./search-result.component.css']
})
export class SearchResultComponent implements AfterViewInit {
  @Input() result: Course;

  ngAfterViewInit() {
    if (!this.result) {
      throw new Error('result parameter must be specified');
    }
  }
}
