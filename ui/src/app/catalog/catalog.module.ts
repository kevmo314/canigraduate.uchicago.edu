import { CourseInfoModule } from 'app/course-info/course-info.module';
import { RequirementLeafDirective } from './requirement-leaf.directive';
import { RequirementNodeComponent } from './requirement-node.component';
import { CatalogComponent } from './catalog.component';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { AngularFireModule } from 'angularfire2';
import { environment } from 'environments/environment';

@NgModule({
  declarations: [
    CatalogComponent,
    RequirementNodeComponent,
    RequirementLeafDirective
  ],
  imports: [
    BrowserModule,
    HttpModule,
    MaterialModule.forRoot(),
    CourseInfoModule,
    AngularFireModule.initializeApp(environment.firebaseConfig)
  ],
  exports: [
    CatalogComponent, RequirementNodeComponent
  ],
  providers: [],
})
export class CatalogModule { }
