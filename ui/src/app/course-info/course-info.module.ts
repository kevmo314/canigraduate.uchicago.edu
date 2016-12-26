import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';
import { AngularFireModule } from 'angularfire2';

import { CourseInfoService } from './course-info.service';

import { environment } from 'environments/environment';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    HttpModule,
    MaterialModule.forRoot(),
    AngularFireModule.initializeApp(environment.firebaseConfig)
  ],
  exports: [],
  providers: [],
})
export class CourseInfoModule { }
