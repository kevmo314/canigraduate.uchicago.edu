import { AppComponent, ContentComponent } from './app.component';
import { CatalogModule } from 'app/catalog/catalog.module';
import { SidebarModule } from 'app/sidebar/sidebar.module';
import { CourseSearchModule } from 'app/course-search/course-search.module';
import { TranscriptService } from 'app/transcript/transcript.service';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';
import { RouterModule, RouteReuseStrategy, DetachedRouteHandle, ActivatedRouteSnapshot } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';

import { CatalogComponent } from 'app/catalog/catalog.component';
import { CourseSearchComponent } from 'app/course-search/course-search.component';

export class StickyOutletReuseStrategy implements RouteReuseStrategy {
  handlers: Map<string, DetachedRouteHandle> = new Map<string, DetachedRouteHandle>();
  shouldDetach(route: ActivatedRouteSnapshot) { return true; }
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle) { this.handlers.set(route.outlet, handle); }
  shouldAttach(route: ActivatedRouteSnapshot) { return this.handlers.has(route.outlet); }
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle { return this.handlers.get(route.outlet); }
  shouldReuseRoute(future: ActivatedRouteSnapshot, current: ActivatedRouteSnapshot) { return future.outlet === current.outlet; }
}

@NgModule({
  declarations: [AppComponent, ContentComponent],
  imports: [
    RouterModule.forRoot([
      {
        path: 'catalog', component: ContentComponent,
        children: [
          {path: '', component: CatalogComponent, outlet: 'catalog'}
        ]
      },
      { path: 'search', component: ContentComponent,
        children: [
          {path: '', component: CourseSearchComponent, outlet: 'search'}
        ]
      },
      { path: '', pathMatch: 'full', redirectTo: '/catalog' }
    ]),
    BrowserModule,
    FormsModule,
    HttpModule,
    SidebarModule,
    CatalogModule,
    CourseSearchModule,
    MaterialModule
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: StickyOutletReuseStrategy },
    TranscriptService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
