import { CourseInfoService } from '../course-info/course-info.service';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Filters } from './filters';

@Component({
  selector: 'cig-course-search',
  templateUrl: './course-search.component.html',
  styleUrls: ['./course-search.component.css']
})
export class CourseSearchComponent {
  filters: Filters = new Filters();
}
