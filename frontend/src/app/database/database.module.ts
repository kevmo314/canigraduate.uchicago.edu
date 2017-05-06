import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AngularFireDatabaseModule} from 'angularfire2/database';

import {DatabaseService} from './database.service';

@NgModule({
  declarations: [],
  imports: [BrowserModule, AngularFireDatabaseModule],
  exports: [],
  providers: [DatabaseService],
})
export class DatabaseModule {
}
