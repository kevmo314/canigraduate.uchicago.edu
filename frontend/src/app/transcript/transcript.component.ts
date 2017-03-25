import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {Transcript} from 'app/transcript';
import {TranscriptRecord} from 'app/transcript-record';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cig-transcript',
  templateUrl: './transcript.component.html',
  styleUrls: ['./transcript.component.scss']
})
export class TranscriptComponent {
  @Input() transcript: Transcript;
  @Input() showGrades: boolean;
  constructor() {}
}
