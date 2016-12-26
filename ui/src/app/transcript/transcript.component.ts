import { Component, Input } from '@angular/core';

import { Transcript } from './transcript';
import { TranscriptRecord } from './transcript-record';

@Component({
  selector: 'cig-transcript',
  templateUrl: './transcript.component.html',
  styleUrls: ['./transcript.component.css']
})
export class TranscriptComponent {
  constructor() {}

  @Input() transcript: Transcript;

  recordsForTerm(term: string): TranscriptRecord[] {
    return this.transcript.records.filter(r => r.term == term);
  }
}
