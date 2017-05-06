import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MaterialModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {AuthenticationService} from 'app/authentication/authentication.service';

import {TranscriptModule} from '../transcript/transcript.module';
import {TranscriptService} from '../transcript/transcript.service';

import {SidebarComponent} from './sidebar.component';

@NgModule({
  declarations: [SidebarComponent],
  imports: [
    BrowserModule, ReactiveFormsModule, FormsModule, MaterialModule,
    TranscriptModule
  ],
  exports: [SidebarComponent],
  providers: [AuthenticationService, TranscriptService]
})
export class SidebarModule {
}
