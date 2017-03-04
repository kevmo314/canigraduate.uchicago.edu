import { SearchResultComponent } from './search-result.component';
import { PaginationComponent } from './pagination.component';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DatabaseModule } from 'app/database/database.module';
import { MaterialModule } from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CourseInfoModule } from 'app/course-info/course-info.module';
import { CourseSearchComponent } from './course-search.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { environment } from 'environments/environment';

// This should really be named SectionSearchModule, but we name it
// course search to reflect consistency with the UI.

@NgModule({
  declarations: [CourseSearchComponent, SearchResultComponent, PaginationComponent],
  imports: [
    BrowserModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CourseInfoModule,
    FlexLayoutModule
  ],
  exports: [CourseSearchComponent],
  providers: [],
})
export class CourseSearchModule { }
