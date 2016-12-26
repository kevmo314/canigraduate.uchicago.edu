import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';

import { AuthenticationModule } from 'app/authentication/authentication.module';
import { AuthenticationService } from 'app/authentication/authentication.service';
import { CourseInfoModule } from 'app/course-info/course-info.module';
import { CourseInfoService } from 'app/course-info/course-info.service';
import { ReauthenticationDialog } from 'app/authentication/reauthentication-dialog.component';

import { TranscriptComponent } from './transcript.component';
import { TranscriptRecordComponent } from './transcript-record.component';
import { TranscriptTermComponent } from './transcript-term.component';
import { TranscriptService } from './transcript.service';

@NgModule({
  declarations: [
    TranscriptComponent,
    TranscriptTermComponent,
    TranscriptRecordComponent
  ],
  imports: [
    AuthenticationModule,
    CourseInfoModule,
    BrowserModule,
    HttpModule,
    MaterialModule.forRoot()
  ],
  exports: [TranscriptComponent],
  providers: [AuthenticationService, CourseInfoService],
  entryComponents: [ReauthenticationDialog],
})
export class TranscriptModule { }
