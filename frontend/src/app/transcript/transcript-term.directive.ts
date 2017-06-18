import {Directive, Input, OnChanges, SimpleChanges} from '@angular/core';
import {DatabaseService} from 'app/database/database.service';
import {Transcript} from 'app/transcript';
import {Observable} from 'rxjs/Observable';

@Directive({selector: '[cigTranscriptTerm]', exportAs: 'cigTranscriptTerm'})
export class TranscriptTermDirective implements OnChanges {
  @Input() transcript: Transcript;
  @Input() expanded = false;

  egpa: Observable<number>;

  constructor(private databaseService: DatabaseService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.transcript && this.transcript) {
      const records = this.transcript.records.map(r => r.course).map(r => {
        return this.databaseService.grades(r).map(grades => {
          return grades.reduce((a, b) => a + b.gpa, 0) / grades.length;
        });
      });
      this.egpa =
          Observable.combineLatest(records)
              .map(grades => grades.filter(grade => !isNaN(grade)))
              .map(grades => grades.reduce((a, b) => a + b, 0) / grades.length);
    }
  }
}
