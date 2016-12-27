import { CatalogService } from './catalog.service';
import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'cig-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css']
})
export class CatalogComponent {
  programs: Map<string, any> = new Map<string, any>();
  constructor(private catalogService: CatalogService) {
    this.catalogService.programs.subscribe(data => {
      this.programs.clear();
      for (let key of Object.keys(data).filter(x => !x.startsWith('$')).sort()) {
        this.programs.set(key, data[key]);
      }
    });
  }

  get majors(): string[] {
    return Array.from(this.programs.keys()).filter(x => !x.endsWith('Minor'));
  }

  get minors(): string[] {
    return Array.from(this.programs.keys()).filter(x => x.endsWith('Minor'));
  }
}
