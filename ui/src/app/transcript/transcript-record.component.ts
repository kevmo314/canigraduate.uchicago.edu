import { Component, Input } from '@angular/core';

import { CourseInfoService } from 'app/course-info/course-info.service';
import { TranscriptRecord } from './transcript-record';

@Component({
  selector: 'cig-transcript-record',
  templateUrl: './transcript-record.component.html',
  styleUrls: ['./transcript-record.component.css']
})
export class TranscriptRecordComponent {
  constructor(private courseInfoService: CourseInfoService) {}

  @Input() record: TranscriptRecord;
  @Input() showGrades: boolean;
}
