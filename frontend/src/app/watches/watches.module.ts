import {NgModule} from '@angular/core';
import {HttpModule} from '@angular/http';
import {MaterialModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {AuthenticationModule} from 'app/authentication/authentication.module';
import {AuthenticationService} from 'app/authentication/authentication.service';
import {DatabaseService} from 'app/database/database.service';

import {DatabaseModule} from './../database/database.module';
import {WatchesComponent} from './watches.component';

@NgModule({
  declarations: [WatchesComponent],
  imports: [
    BrowserModule, AuthenticationModule, DatabaseModule, HttpModule,
    MaterialModule
  ],
  exports: [],
  providers: [AuthenticationService, DatabaseService],
  entryComponents: [WatchesComponent],
})
export class WatchesModule {
}
