import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {MaterialModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {AuthenticationModule} from 'app/authentication/authentication.module';
import {AuthenticationService} from 'app/authentication/authentication.service';
import {DatabaseService} from 'app/database/database.service';

import {DatabaseModule} from './../database/database.module';
import {PrefixPipe, WatchesComponent} from './watches.component';

@NgModule({
  declarations: [WatchesComponent, PrefixPipe],
  imports: [
    BrowserModule, AuthenticationModule, DatabaseModule, HttpModule,
    MaterialModule, ReactiveFormsModule
  ],
  exports: [],
  providers: [AuthenticationService, DatabaseService],
  entryComponents: [WatchesComponent],
})
export class WatchesModule {
}
