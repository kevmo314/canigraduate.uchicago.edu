import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CourseNameComponent } from './course-name.component';
import { environment } from 'environments/environment';

@NgModule({
  declarations: [CourseNameComponent],
  imports: [BrowserModule],
  exports: [CourseNameComponent],
  providers: [],
})
export class CourseInfoModule { }
