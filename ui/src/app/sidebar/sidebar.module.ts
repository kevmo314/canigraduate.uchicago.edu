import { NgModule } from '@angular/core';
import { BrowserModule }  from '@angular/platform-browser';
import { MaterialModule } from '@angular/material';

import { SidebarComponent } from './sidebar.component';

@NgModule({
  declarations: [SidebarComponent],
  imports: [BrowserModule, MaterialModule.forRoot()],
  exports: [SidebarComponent],
  providers: []
})
export class SidebarModule { }
