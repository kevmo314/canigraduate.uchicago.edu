import { CourseInfoService } from '../course-info/course-info.service';
import { TranscriptRecord } from '../transcript/transcript-record';
import { Transcript } from '../transcript/transcript';
import { TranscriptService } from '../transcript/transcript.service';
import { RequirementNodeComponent } from './requirement-node.component';
import { CatalogService } from './catalog.service';
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
  private _remaining = 0;
  private _coursesUsed: TranscriptRecord[] = [];

  constructor(private transcriptService: TranscriptService, private courseInfoService: CourseInfoService) {}

  ngAfterViewInit() {
    this.transcriptService.transcript.subscribe(t => this.evaluateTranscript(t));
  }

  get completed() { return this.remaining === 0; }
  get progress() { return this._progress; }
  get remaining() { return this._remaining; }

  private evaluateTranscript(transcript: Transcript) {
    this._progress = 0;
    this._remaining = 0;
    this._coursesUsed.length = 0;
    // TODO: Remove records that are in the same crosslist equivalence class.
    const coursesTaken = new Set(transcript.records.map(r => r.id));
    this.requirementNodeComponent.evaluateTranscriptRecords(transcript, coursesTaken).then(state => {
      // The courses used are those that no longer appear in coursesTaken.
      this._coursesUsed = transcript.records.filter(r => !coursesTaken.has(r.id));
    });
  }
}
