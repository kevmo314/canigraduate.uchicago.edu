import {NgModule} from '@angular/core';
import {MaterialModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {environment} from 'environments/environment';

import {CourseDetailComponent} from './course-detail.component';
import {CourseNameComponent} from './course-name.component';
import {SectionComponent} from './section.component';
import {TermOfferIndicatorComponent} from './term-offer-indicator.component';

@NgModule({
  declarations: [
    CourseNameComponent, CourseDetailComponent, TermOfferIndicatorComponent,
    SectionComponent
  ],
  imports: [BrowserModule, MaterialModule],
  exports:
      [CourseNameComponent, CourseDetailComponent, TermOfferIndicatorComponent],
  providers: [],
})
export class CourseInfoModule {
  constructor() {
    console.log("Course info module constructed");
  }
}
