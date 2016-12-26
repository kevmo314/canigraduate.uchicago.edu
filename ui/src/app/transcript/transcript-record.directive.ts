import { Directive, Input } from '@angular/core';

import { TranscriptRecord } from './transcript-record';

@Directive({selector: '[cig-transcript-record]', exportAs: 'cigTranscriptRecord'})
export class TranscriptRecordDirective {
  @Input() record: TranscriptRecord;
}
