import { Directive, Input } from '@angular/core';

import { CourseInfoService } from 'app/course-info/course-info.service';
import { TranscriptRecord } from './transcript-record';

@Directive({selector: '[cig-transcript-term]', exportAs: 'cigTranscriptTerm'})
export class TranscriptTermDirective {
  @Input() records: TranscriptRecord[];
  @Input() expanded: boolean = false;

  get gpa(): number {
    const quality = this.records.filter(r => r.quality);
    return quality.length ? quality.reduce((sum, r) => sum + r.gpa, 0) / quality.length : 0;
  }
}
