import {AfterViewInit, animate, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Transcript} from 'app/transcript';
import {TranscriptRecord} from 'app/transcript-record';
import {Observable} from 'rxjs/Observable';
import {Memoize} from 'typescript-memoize';

import {DatabaseService} from './../database/database.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cig-egpa',
  template: '<ng-container *ngIf="show">(' +
      '<span class="value" [ngClass]="{\'blur\': blur}">{{content | number:"1.2-2"}}</span>)</ng-container>',
  styles: [
    '.value { transform: all 0.3s ease-in; }',
    '.blur { text-shadow: 0 0 8px grey; color: transparent; }'
  ],
})
export class EgpaComponent implements OnChanges {
  @Input() egpa: number;

  show = true;
  blur = true;

  ngOnChanges(changes: SimpleChanges) {
    if (changes.egpa) {
      if (isNaN(this.egpa)) {
        this.show = false;
      } else if (!this.egpa) {
        this.show = true;
        this.blur = true;
      } else {
        this.show = true;
        this.blur = false;
      }
    }
  }

  get content() {
    return this.blur ? 8.88 : this.egpa;
  }
}