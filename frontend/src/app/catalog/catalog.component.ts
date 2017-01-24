import { Transcript } from '../transcript/transcript';
import { TranscriptService } from '../transcript/transcript.service';
import { DatabaseService } from 'app/database/database.service';
import { RequirementNodeComponent } from './requirement-node.component';
import { Component, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Program } from 'app/program';

@Component({
  selector: 'cig-catalog',
  template: `<div class="catalog"><cig-program *ngFor="let program of majors" [title]="program.name" [program]="program"></cig-program></div>`,
  styleUrls: ['./catalog.component.css']
})
export class CatalogComponent {
  majors: Program[] = [];
  minors: Program[] = [];
  progress: Map<string, {completed: number, remaining: number}>;

  constructor(
    private databaseService: DatabaseService,
    private transcriptService: TranscriptService) {
    this.databaseService.programs.subscribe(data => {
      this.majors = data.filter(x => !x.name.endsWith('Minor')).sort();
      this.minors = data.filter(x => x.name.endsWith('Minor')).sort();
    });
  }
}
