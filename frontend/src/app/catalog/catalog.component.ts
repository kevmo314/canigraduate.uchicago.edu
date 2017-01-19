import { Transcript } from '../transcript/transcript';
import { TranscriptService } from '../transcript/transcript.service';
import { RequirementNodeComponent } from './requirement-node.component';
import { CatalogService } from './catalog.service';
import { Component, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'cig-catalog',
  template: `<cig-program *ngFor="let program of majors" [title]="program[0]" [program]="program[1]"></cig-program>`,
  styleUrls: ['./catalog.component.css']
})
export class CatalogComponent {
  majors: [string, any][] = [];
  minors: [string, any][] = [];
  progress: Map<string, {completed: number, remaining: number}>;

  constructor(
    private catalogService: CatalogService,
    private transcriptService: TranscriptService) {
    this.catalogService.programs.subscribe(data => {
      const programs = new Map<string, any>();
      for (let key of Object.keys(data).filter(x => !x.startsWith('$')).sort()) {
        programs.set(key, data[key]);
      }
      this.majors = Array.from(programs.entries()).filter(x => !x[0].endsWith('Minor'));
      this.minors = Array.from(programs.entries()).filter(x => x[0].endsWith('Minor'));
    });
  }
}
