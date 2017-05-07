import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {MaterialModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';

import {AuthenticationService} from './authentication.service';
import {ReauthenticationDialogComponent} from './reauthentication-dialog.component';

@NgModule({
  declarations: [ReauthenticationDialogComponent],
  entryComponents: [ReauthenticationDialogComponent],
  imports: [BrowserModule, HttpModule, FormsModule, MaterialModule],
  exports: [],
  providers: []
})
export class AuthenticationModule {
}
