import { TranscriptRecord } from '../transcript/transcript-record';
import { Transcript } from '../transcript/transcript';
import { TranscriptService } from '../transcript/transcript.service';
import { RequirementNodeComponent } from './requirement-node.component';
import { Component, ViewChild, QueryList, AfterViewInit, Input } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'cig-program',
  templateUrl: './program.component.html',
  styleUrls: ['./program.component.css']
})
export class ProgramComponent implements AfterViewInit {
  @Input() title: string;
  @Input() program: any;
  @ViewChild(RequirementNodeComponent) requirementNodeComponent: RequirementNodeComponent;

  private _progress = 0;
  private _total = 0;
  private _coursesUsed: TranscriptRecord[] = [];
  hide: boolean = true;

  constructor(private transcriptService: TranscriptService) {}

  ngAfterViewInit() {
    this.transcriptService.transcript.subscribe(t => this.evaluateTranscript(t));
  }

  get complete() { return this.progress === this.total; }
  get progress() { return this._progress; }
  get total() { return this._total; }

  private evaluateTranscript(transcript: Transcript) {
    this._coursesUsed.length = 0;
    // TODO: Remove records that are in the same crosslist equivalence class.
    const coursesTaken = new Set(transcript.records.map(r => r.id));
    this.requirementNodeComponent.evaluateTranscriptRecords(transcript, coursesTaken).then(state => {
      // The courses used are those that no longer appear in coursesTaken.
      this._progress = state.progress;
      this._total = state.total;
      this._coursesUsed = transcript.records.filter(r => !coursesTaken.has(r.id));
    });
  }
}
