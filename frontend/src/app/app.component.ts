import { Component, AfterViewInit, HostBinding } from '@angular/core';
import { MdTabChangeEvent } from '@angular/material';
import { Router, NavigationEnd } from '@angular/router';
import { environment } from 'environments/environment';

const TAB_LINKS = ['/catalog', '/search', '/watches'];

@Component({
  selector: 'cig-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class ContentComponent implements AfterViewInit {
  selectedIndex: number = 0;
  constructor(private router: Router) { }
  ngAfterViewInit() {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        this.selectedIndex = TAB_LINKS.findIndex(link => e.url.startsWith(link));
      }
    });
  }

  get institutionName(): string { return environment.institution.name; }
  get institutionTheme(): string {
    return environment.institution.theme;
  }

  changeTab(e: MdTabChangeEvent) {
    this.router.navigateByUrl(TAB_LINKS[e.index]);
  }
}

/** A pseudo-component to give the router a default outlet. */
// tslint:disable-next-line:component-selector
@Component({selector: 'body', template: '<router-outlet></router-outlet>'})
export class AppComponent {
  @HostBinding('class') public theme = environment.institution.theme;
}