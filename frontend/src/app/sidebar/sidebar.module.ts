import { SidebarComponent } from './sidebar.component';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { AuthenticationService } from 'app/authentication/authentication.service';
import { TranscriptModule } from 'app/transcript/transcript.module';
import { TranscriptService } from 'app/transcript/transcript.service';

@NgModule({
  declarations: [SidebarComponent],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    TranscriptModule,
    MaterialModule
  ],
  exports: [SidebarComponent],
  providers: [AuthenticationService, TranscriptService]
})
export class SidebarModule { }
