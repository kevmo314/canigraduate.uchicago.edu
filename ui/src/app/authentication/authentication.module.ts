import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '@angular/material';

import { CookieService } from 'angular2-cookie/services/cookies.service';

import { AuthenticationService } from './authentication.service';
import { ReauthenticationDialog } from './reauthentication-dialog.component';

@NgModule({
  declarations: [ReauthenticationDialog],
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    MaterialModule.forRoot()
  ],
  exports: [],
  providers: [ CookieService ]
})
export class AuthenticationModule { }
