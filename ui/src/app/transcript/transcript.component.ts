import { Component, Input } from '@angular/core';

import { Transcript } from './transcript';
import { TranscriptRecord } from './transcript-record';

@Component({
  selector: 'cig-transcript',
  templateUrl: './transcript.component.html',
  styleUrls: ['./transcript.component.css']
})
export class TranscriptComponent {
  @Input() transcript: Transcript;

  @Input() showGrades: boolean;

  getRecords(term: string): TranscriptRecord[] {
    return this.transcript.records.filter(r => r.term == term);
  }

  /**
   * Get the cumulative GPA up to a given term.
   * @param term The term to find cumulative GPA for, inclusive.
   * @returns number
   */
  getCumulativeGpa(term: string): number {
    let visited: boolean = false; // true if we've visited the target term.
    let total: number = 0.0;
    let count: number = 0;
    for(let record of this.transcript.records) {
      if(record.term == term) {
        visited = true;
      } else if(visited) { // Now on the quarter after the desired term.
        break;
      }
      if(record.gpa !== null) {
        total += record.gpa;
        count++;
      }
    }
    return count ? total / count : 0;
  }
}
