import { Transcript } from '../transcript/transcript';
import { TranscriptService } from '../transcript/transcript.service';
import { RequirementNodeComponent } from './requirement-node.component';
import { CatalogService } from './catalog.service';
import { Component, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'cig-catalog',
  template: `<cig-program *ngFor="let program of majors" [program]="program"></cig-program>`,
  styleUrls: ['./catalog.component.css']
})
export class CatalogComponent {
  programs: Map<string, any> = new Map<string, any>();

  progress: Map<string, {completed: number, remaining: number}>;

  constructor(
    private catalogService: CatalogService,
    private transcriptService: TranscriptService) {
    this.catalogService.programs.subscribe(data => {
      this.programs.clear();
      for (let key of Object.keys(data).filter(x => !x.startsWith('$')).sort()) {
        this.programs.set(key, data[key]);
      }
    });
  }

  get majors(): [string, any][] {
    return Array.from(this.programs.entries()).filter(x => !x[0].endsWith('Minor'));
  }

  get minors(): [string, any][] {
    return Array.from(this.programs.entries()).filter(x => x[0].endsWith('Minor'));
  }
}
