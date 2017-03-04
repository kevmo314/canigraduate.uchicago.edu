import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CourseNameComponent } from './course-name.component';
import { MaterialModule } from '@angular/material';
import { environment } from 'environments/environment';

@NgModule({
  declarations: [CourseNameComponent],
  imports: [
    BrowserModule,
    MaterialModule
  ],
  exports: [CourseNameComponent],
  providers: [],
})
export class CourseInfoModule { }
