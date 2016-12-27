import { CatalogService } from './catalog/catalog.service';
import { AppComponent } from './app.component';
import { CatalogModule } from './catalog/catalog.module';
import { SidebarModule } from './sidebar/sidebar.module';
import { TranscriptService } from './transcript/transcript.service';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    SidebarModule,
    CatalogModule,
    MaterialModule.forRoot()
  ],
  providers: [TranscriptService, CatalogService],
  bootstrap: [AppComponent]
})
export class AppModule { }
