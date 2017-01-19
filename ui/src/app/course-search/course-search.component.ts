import { CourseInfoService } from '../course-info/course-info.service';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Filters, DayOfWeek } from './filters';

@Component({
  selector: 'cig-course-search',
  templateUrl: './course-search.component.html',
  styleUrls: ['./course-search.component.css']
})
export class CourseSearchComponent {
  filters: Filters = new Filters();
  
  get monday() { return this.filters.getDayOfWeekFilter(DayOfWeek.Monday); }
  set monday(value) { this.filters.setDayOfWeekFilter(DayOfWeek.Monday, value); }
  get tuesday() { return this.filters.getDayOfWeekFilter(DayOfWeek.Tuesday); }
  set tuesday(value) { this.filters.setDayOfWeekFilter(DayOfWeek.Tuesday, value); }
  get wednesday() { return this.filters.getDayOfWeekFilter(DayOfWeek.Wednesday); }
  set wednesday(value) { this.filters.setDayOfWeekFilter(DayOfWeek.Wednesday, value); }
  get thursday() { return this.filters.getDayOfWeekFilter(DayOfWeek.Thursday); }
  set thursday(value) { this.filters.setDayOfWeekFilter(DayOfWeek.Thursday, value); }
  get friday() { return this.filters.getDayOfWeekFilter(DayOfWeek.Friday); }
  set friday(value) { this.filters.setDayOfWeekFilter(DayOfWeek.Friday, value); }
  get saturday() { return this.filters.getDayOfWeekFilter(DayOfWeek.Saturday); }
  set saturday(value) { this.filters.setDayOfWeekFilter(DayOfWeek.Saturday, value); }
  get sunday() { return this.filters.getDayOfWeekFilter(DayOfWeek.Sunday); }
  set sunday(value) { this.filters.setDayOfWeekFilter(DayOfWeek.Sunday, value); }
}
