import { Program } from 'app/program';
import { Transcript } from 'app/transcript';
import { TranscriptRecord } from 'app/transcript-record';
import { TranscriptService } from '../transcript/transcript.service';
import { RequirementNodeComponent } from './requirement-node.component';
import { Component, ViewChild, QueryList, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'cig-program',
  templateUrl: './program.component.html',
  styleUrls: ['./program.component.css']
})
export class ProgramComponent implements OnInit {
  @Input() title: string;
  @Input() program: Program;
  @ViewChild(RequirementNodeComponent) requirementNodeComponent: RequirementNodeComponent;

  private _coursesUsed: TranscriptRecord[] = [];
  hide = true;
  gpa: number = null;

  constructor(private transcriptService: TranscriptService) { }

  ngOnInit() {
    this.program.ready.then(() => {
      this.program.evaluate(new Transcript());
      this.transcriptService.transcript.subscribe(t => {
        const credit = new Transcript(t.records.filter(r => r.credit));
        this.program.evaluate(credit).then(used => {
          this.gpa = credit.getFilteredGpa(r => used.has(r));
        });
      });
    });
  }

  get complete() { return this.progress === this.total; }
  get progress() { return this.program.progress; }
  get total() { return this.program.total; }
}
