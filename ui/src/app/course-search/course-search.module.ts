import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CourseSearchComponent } from './course-search.component';
import { AngularFireModule } from 'angularfire2';
import { environment } from 'environments/environment';

// This should really be named SectionSearchModule, but we name it
// course search to reflect consistency with the UI.

@NgModule({
  declarations: [CourseSearchComponent],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebaseConfig)
  ],
  exports: [CourseSearchComponent],
  providers: [],
})
export class CourseSearchModule { }
