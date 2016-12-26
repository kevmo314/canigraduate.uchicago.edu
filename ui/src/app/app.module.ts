import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';

import { SidebarModule } from './sidebar/sidebar.module';
import { TranscriptService } from './transcript/transcript.service';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    SidebarModule,
    MaterialModule.forRoot()
  ],
  providers: [TranscriptService],
  bootstrap: [AppComponent]
})
export class AppModule { }
