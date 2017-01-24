import { CourseInfoModule } from 'app/course-info/course-info.module';
import { RequirementLeafComponent } from './requirement-leaf.component';
import { RequirementNodeComponent } from './requirement-node.component';
import { CatalogComponent } from './catalog.component';
import { ProgramComponent } from './program.component';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { DatabaseModule } from 'app/database/database.module';
import { AngularFireModule } from 'angularfire2';
import { environment } from 'environments/environment';

@NgModule({
  declarations: [
    CatalogComponent,
    ProgramComponent,
    RequirementNodeComponent,
    RequirementLeafComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    MaterialModule.forRoot(),
    CourseInfoModule,
    DatabaseModule,
    AngularFireModule.initializeApp(environment.firebaseConfig)
  ],
  exports: [CatalogComponent, ProgramComponent, RequirementNodeComponent, RequirementLeafComponent],
  providers: [],
})
export class CatalogModule { }
