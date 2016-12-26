import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';

import { AuthenticationService } from './authentication.service';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    HttpModule,
    MaterialModule.forRoot()
  ],
  exports: [],
  providers: [],
})
export class AuthenticationModule { }
