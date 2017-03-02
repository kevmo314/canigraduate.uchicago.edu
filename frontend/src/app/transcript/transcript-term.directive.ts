import { Directive, Input } from '@angular/core';

import { TranscriptRecord } from './transcript-record';

@Directive({ selector: '[cigTranscriptTerm]', exportAs: 'cigTranscriptTerm' })
export class TranscriptTermDirective {
  @Input() records: TranscriptRecord[];
  @Input() expanded: boolean = false;

  get gpa(): number {
    const quality = this.records.filter(r => r.quality);
    return quality.length ? quality.reduce((sum, r) => sum + r.gpa, 0) / quality.length : 0;
  }
}
