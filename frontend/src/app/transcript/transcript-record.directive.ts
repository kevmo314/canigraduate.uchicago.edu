import { Directive, Input } from '@angular/core';

import { TranscriptRecord } from 'app/transcript-record';

@Directive({ selector: '[cigTranscriptRecord]', exportAs: 'cigTranscriptRecord' })
export class TranscriptRecordDirective {
  @Input() record: TranscriptRecord;
}
