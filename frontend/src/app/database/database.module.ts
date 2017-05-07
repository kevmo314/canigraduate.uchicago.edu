import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AngularFireAuthModule} from 'angularfire2/auth';
import {AngularFireDatabaseModule} from 'angularfire2/database';

import {DatabaseService} from './database.service';

@NgModule({
  declarations: [],
  imports: [BrowserModule, AngularFireDatabaseModule, AngularFireAuthModule],
  exports: [],
  providers: [DatabaseService],
})
export class DatabaseModule {
}
