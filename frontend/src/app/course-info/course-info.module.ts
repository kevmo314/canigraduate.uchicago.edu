import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CourseNameComponent } from './course-name.component';
import { CourseDetailComponent } from './course-detail.component';
import { TermOfferIndicatorComponent } from './term-offer-indicator.component';
import { MaterialModule } from '@angular/material';
import { environment } from 'environments/environment';

@NgModule({
  declarations: [CourseNameComponent, CourseDetailComponent, TermOfferIndicatorComponent],
  imports: [
    BrowserModule,
    MaterialModule
  ],
  exports: [CourseNameComponent, CourseDetailComponent, TermOfferIndicatorComponent],
  providers: [],
})
export class CourseInfoModule { }
