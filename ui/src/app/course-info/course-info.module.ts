import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AngularFireModule } from 'angularfire2';
import { CourseNameComponent } from './course-name.component';
import { environment } from 'environments/environment';
import { CrosslistInvariantPrefixMultiSet } from './crosslist-invariant-prefix-multi-set';

@NgModule({
  declarations: [CourseNameComponent],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebaseConfig)
  ],
  exports: [CourseNameComponent, CrosslistInvariantPrefixMultiSet],
  providers: [],
})
export class CourseInfoModule { }
