import {NgModule} from '@angular/core';
import {MaterialModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {environment} from 'environments/environment';

import {CourseDetailComponent, MatchSectionPipe} from './course-detail.component';
import {CourseNameComponent} from './course-name.component';
import {GradesHistogramComponent} from './grades-histogram.component';
import {ScheduleIndicatorComponent} from './schedule-indicator.component';
import {SectionComponent} from './section.component';
import {TermOfferIndicatorComponent} from './term-offer-indicator.component';

@NgModule({
  declarations: [
    CourseNameComponent, CourseDetailComponent, TermOfferIndicatorComponent,
    SectionComponent, MatchSectionPipe, GradesHistogramComponent,
    ScheduleIndicatorComponent
  ],
  imports: [BrowserModule, MaterialModule],
  exports:
      [CourseNameComponent, CourseDetailComponent, TermOfferIndicatorComponent],
  providers: [],
})
export class CourseInfoModule {
}
