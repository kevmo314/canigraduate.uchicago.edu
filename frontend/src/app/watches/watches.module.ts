import {NgModule} from '@angular/core';
import {HttpModule} from '@angular/http';
import {MaterialModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {AuthenticationModule} from 'app/authentication/authentication.module';
import {AuthenticationService} from 'app/authentication/authentication.service';

import {WatchesComponent} from './watches.component';

@NgModule({
  declarations: [WatchesComponent],
  imports: [BrowserModule, AuthenticationModule, HttpModule, MaterialModule],
  exports: [],
  providers: [AuthenticationService],
  entryComponents: [WatchesComponent],
})
export class WatchesModule {
}
