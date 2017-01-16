import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AngularFireModule } from 'angularfire2';
import { CourseNameComponent } from './course-name.component';
import { environment } from 'environments/environment';

@NgModule({
  declarations: [CourseNameComponent],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebaseConfig)
  ],
  exports: [CourseNameComponent],
  providers: [],
})
export class CourseInfoModule { }
