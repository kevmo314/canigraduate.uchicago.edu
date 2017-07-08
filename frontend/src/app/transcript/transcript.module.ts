import {NgModule} from '@angular/core';
import {HttpModule} from '@angular/http';
import {MaterialModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {AuthenticationModule} from 'app/authentication/authentication.module';
import {AuthenticationService} from 'app/authentication/authentication.service';
import {ReauthenticationDialogComponent} from 'app/authentication/reauthentication-dialog.component';
import {CourseInfoModule} from 'app/course-info/course-info.module';

import {EgpaComponent} from './egpa.component';
import {TranscriptRecordDirective} from './transcript-record.directive';
import {TranscriptTermDirective} from './transcript-term.directive';
import {TranscriptComponent} from './transcript.component';
import {TranscriptService} from './transcript.service';

@NgModule({
  declarations: [
    EgpaComponent, TranscriptComponent, TranscriptTermDirective,
    TranscriptRecordDirective
  ],
  imports: [
    AuthenticationModule, CourseInfoModule, BrowserModule, HttpModule,
    MaterialModule
  ],
  exports: [TranscriptComponent],
  providers: [AuthenticationService],
  entryComponents: [ReauthenticationDialogComponent],
})
export class TranscriptModule {
}
