import {NgModule} from '@angular/core';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MaterialModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {CourseInfoModule} from 'app/course-info/course-info.module';
import {DatabaseModule} from 'app/database/database.module';
import {environment} from 'environments/environment';
import {FilnuxModule} from 'filnux';

import {FiltersComponent} from './filters.component';
import {RemovePipe, SearchPipe, SectionFiltersComponent} from './section-filters.component';

@NgModule({
  declarations:
      [FiltersComponent, SectionFiltersComponent, RemovePipe, SearchPipe],
  imports: [
    BrowserModule, MaterialModule, FormsModule, ReactiveFormsModule,
    CourseInfoModule, FlexLayoutModule
  ],
  exports: [FiltersComponent],
  providers: [],
})
export class FiltersModule {
}
