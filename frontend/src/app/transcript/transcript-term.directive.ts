import {Directive, Input} from '@angular/core';

import {Transcript} from 'app/transcript';

@Directive({selector: '[cigTranscriptTerm]', exportAs: 'cigTranscriptTerm'})
export class TranscriptTermDirective {
  @Input() transcript: Transcript;
  @Input() expanded = false;
}
