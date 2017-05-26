import {NgModule, Type} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {MaterialModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy, RouterModule} from '@angular/router';
import {AngularFireModule} from 'angularfire2';
import {CatalogComponent} from 'app/catalog/catalog.component';
import {CatalogModule} from 'app/catalog/catalog.module';
import {CourseSearchComponent} from 'app/course-search/course-search.component';
import {CourseSearchModule} from 'app/course-search/course-search.module';
import {SidebarModule} from 'app/sidebar/sidebar.module';
import {TranscriptService} from 'app/transcript/transcript.service';
import {environment} from 'environments/environment';
import {FilnuxModule} from 'filnux';

import {AppComponent, ContentComponent} from './app.component';
import {SidebarComponent} from './sidebar/sidebar.component';
import {WatchesComponent} from './watches/watches.component';
import {WatchesModule} from './watches/watches.module';

export class StickyReuseStrategy implements RouteReuseStrategy {
  handlers: Map<string, DetachedRouteHandle> =
      new Map<string, DetachedRouteHandle>();
  shouldDetach(route: ActivatedRouteSnapshot) {
    return true;
  }
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle) {
    this.handlers.set(route.routeConfig.path, handle);
  }
  shouldAttach(route: ActivatedRouteSnapshot) {
    return !!route.routeConfig && !!this.handlers.get(route.routeConfig.path);
  }
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
    if (!route.routeConfig) {
      return null;
    }
    return this.handlers.get(route.routeConfig.path);
  }
  shouldReuseRoute(
      future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot) {
    return future.routeConfig === curr.routeConfig;
  }
}

@NgModule({
  declarations: [AppComponent, ContentComponent],
  imports: [
    RouterModule.forRoot([
      {
        path: 'catalog',
        component: ContentComponent,
        children: [
          {path: '', component: CatalogComponent, outlet: 'content'},
          {path: '', component: SidebarComponent, outlet: 'sidebar'}
        ]
      },
      {
        path: 'search',
        component: ContentComponent,
        children: [
          {path: '', component: CourseSearchComponent, outlet: 'content'},
          {path: '', component: SidebarComponent, outlet: 'sidebar'}
        ]
      },
      {
        path: 'watches',
        component: ContentComponent,
        children: [
          {path: '', component: WatchesComponent, outlet: 'content'},
          {path: '', component: SidebarComponent, outlet: 'sidebar'}
        ]
      },
      {path: '', pathMatch: 'full', redirectTo: '/catalog'}
    ]),
    BrowserModule, FormsModule, HttpModule, SidebarModule, CatalogModule,
    WatchesModule, BrowserAnimationsModule, CourseSearchModule, MaterialModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    FilnuxModule.forRoot(AppModule)
  ],
  providers: [
    {provide: RouteReuseStrategy, useClass: StickyReuseStrategy},
    TranscriptService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
