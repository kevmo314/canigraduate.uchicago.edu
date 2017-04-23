import {NgModule, Type} from '@angular/core';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MaterialModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {CourseInfoModule} from 'app/course-info/course-info.module';
import {DatabaseModule} from 'app/database/database.module';
import {environment} from 'environments/environment';
import {FilnuxModule} from 'filnux';

import {CountPipe, CourseSearchComponent} from './course-search.component';
import {FiltersModule} from './filters/filters.module';
import {PaginationComponent} from './pagination.component';
import {SearchResultComponent} from './search-result.component';

// This should really be named SectionSearchModule, but we name it
// course search to reflect consistency with the UI.
@NgModule({
  declarations: [
    CourseSearchComponent, SearchResultComponent, PaginationComponent, CountPipe
  ],
  imports: [
    BrowserModule, MaterialModule, FormsModule, ReactiveFormsModule,
    CourseInfoModule, FlexLayoutModule, FiltersModule
  ],
  exports: [CourseSearchComponent],
  providers: [],
})
export class CourseSearchModule {
}
