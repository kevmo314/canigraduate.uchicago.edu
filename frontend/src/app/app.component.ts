import {AfterViewInit, Component, HostBinding} from '@angular/core';
import {MdTabChangeEvent} from '@angular/material';
import {NavigationEnd, Router} from '@angular/router';
import {environment} from 'environments/environment';


@Component({
  selector: 'cig-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class ContentComponent implements AfterViewInit {
  selectedIndex = 0;
  links = [
    {link: '/catalog', label: 'Catalog'},
    {link: '/search', label: 'Course Search'},
    {link: '/watches', label: 'Watches'}
  ];
  constructor(private router: Router) {}
  ngAfterViewInit() {
    /*  this.router.events.subscribe(e => {
        if (e instanceof NavigationEnd) {
          this.selectedIndex =
              this.links.findIndex(link => e.url.startsWith(link.link));
        }
      });*/
  }

  get institutionName(): string {
    return environment.institution.name;
  }
  get institutionTheme(): string {
    return environment.institution.theme;
  }
}

/** A pseudo-component to give the router a default outlet. */
// tslint:disable-next-line:component-selector
@Component({selector: 'body', template: '<router-outlet></router-outlet>'})
export class AppComponent {
  @HostBinding('class') public theme = environment.institution.theme;
}