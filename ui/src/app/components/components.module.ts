import { NgModule } from '@angular/core';
import { ChipToggleComponent } from './chip-toggle.component';
import { MaterialModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';

@NgModule({
  declarations: [
    ChipToggleComponent
  ],
  imports: [
    BrowserModule,
    MaterialModule.forRoot()
  ],
  exports: [
    ChipToggleComponent
  ],
  providers: []
})
export class ComponentsModule { }