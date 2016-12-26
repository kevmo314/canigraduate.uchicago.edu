import { Component, Input } from '@angular/core';

import { CourseInfoService } from 'app/course-info/course-info.service';
import { TranscriptRecord } from './transcript-record';

@Component({
  selector: 'cig-transcript-term',
  templateUrl: './transcript-term.component.html',
  styleUrls: ['./transcript-term.component.css']
})
export class TranscriptTermComponent {
  /** Term name. */
  @Input() term: string;
  @Input() records: TranscriptRecord[];
  /** Cumulative GPA, inclusive. */
  @Input() cumulativeGpa: number;
  @Input() expanded: boolean = false;
  @Input() showGrades: boolean;

  get gpa(): number {
    const quality = this.records.filter(r => r.quality);
    return quality.length ? quality.reduce((sum, r) => sum + r.gpa, 0) / quality.length : 0;
  }
}
