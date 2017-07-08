import {Directive, Input, OnChanges, SimpleChanges} from '@angular/core';
import {DatabaseService} from 'app/database/database.service';
import {Transcript} from 'app/transcript';
import {mean, median} from 'math';
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
        return this.databaseService.grades(r)
            .map(grades => grades.map(grade => grade.gpa))
            .map(median);
      });
      this.egpa = Observable.combineLatest(records)
                      .map(grades => grades.filter(grade => !isNaN(grade)))
                      .map(mean);
    }
  }
}
