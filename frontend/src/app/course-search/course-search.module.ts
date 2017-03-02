import { SearchResultComponent } from './search-result.component';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MaterialModule } from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CourseSearchComponent } from './course-search.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { environment } from 'environments/environment';

// This should really be named SectionSearchModule, but we name it
// course search to reflect consistency with the UI.

@NgModule({
  declarations: [CourseSearchComponent, SearchResultComponent],
  imports: [
    BrowserModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule
  ],
  exports: [CourseSearchComponent],
  providers: [],
})
export class CourseSearchModule { }
