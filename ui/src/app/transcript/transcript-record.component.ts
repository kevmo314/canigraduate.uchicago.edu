import { Component, Input } from '@angular/core';

import { TranscriptRecord } from './transcript-record';

@Component({
  selector: 'cig-transcript-record',
  templateUrl: './transcript-record.component.html',
  styleUrls: ['./transcript-record.component.css']
})
export class TranscriptRecordComponent {
  constructor() {}

  @Input() record: TranscriptRecord;
}
