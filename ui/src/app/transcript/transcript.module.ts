import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';

import { AuthenticationService } from 'app/authentication/authentication.service';

import { TranscriptComponent } from './transcript.component';
import { TranscriptRecordComponent } from './transcript-record.component';
import { TranscriptService } from './transcript.service';

@NgModule({
  declarations: [TranscriptComponent, TranscriptRecordComponent],
  imports: [
    BrowserModule,
    HttpModule,
    MaterialModule.forRoot()
  ],
  exports: [TranscriptComponent],
  providers: [AuthenticationService],
})
export class TranscriptModule { }
