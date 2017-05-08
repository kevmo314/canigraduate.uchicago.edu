import {animate, Component, Input, OnInit, Pipe, PipeTransform, style, transition, trigger} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AuthenticationService} from 'app/authentication/authentication.service';
import {DatabaseService} from 'app/database/database.service';
import {Watch} from 'app/watch';
import {environment} from 'environments/environment';
import {Observable} from 'rxjs/Observable';

import {CountPipe} from './../course-search/course-search.component';

@Component({
  selector: 'cig-watches',
  templateUrl: './watches.component.html',

  animations: [trigger(
      'alert',
      [
        transition(
            ':enter',
            [
              style({marginTop: '-68px', opacity: 0}),
              animate('200ms ease-in', style({marginTop: '0px', opacity: 1}))
            ]),
        transition(
            ':leave',
            [
              style({marginTop: '0px', opacity: 1}),
              animate(
                  '200ms ease-out',
                  style({marginTop: '-68px', opacity: 0}))
            ])
      ])],
  styleUrls: ['./watches.component.scss'],
})
export class WatchesComponent implements OnInit {
  courses: Observable<string[]>;
  terms: Observable<string[]>;
  watches: Observable<Watch[]>;
  addWatchForm: FormGroup;
  constructor(
      private authenticationService: AuthenticationService,
      private databaseService: DatabaseService) {
    this.watches = this.databaseService.watches;
    this.courses =
        this.databaseService.indexes('all').map(x => Array.from(x).sort());
    this.terms = this.databaseService.terms;
  }

  ngOnInit() {
    this.addWatchForm = new FormGroup({
      course: new FormControl(),
      term: new FormControl(),
      section: new FormControl(),
    });
    this.authenticationService.credentials.map(x => x.validated)
        .subscribe(value => {
          if (value) {
            this.addWatchForm.enable();
          } else {
            this.addWatchForm.disable();
          }
        });
    this.addWatchForm.valueChanges.debounceTime(500)
        .withLatestFrom(
            this.courses.map(courses => courses.map(c => c.toUpperCase())),
            this.terms.map(terms => terms.map(t => t.toUpperCase())))
        .subscribe(([values, courses, terms]) => {
          if (values.course &&
              courses.indexOf(values.course.toUpperCase()) === -1) {
            this.addWatchForm.get('course').setErrors({'missing': true});
          } else {
            this.addWatchForm.get('course').setErrors(null);
          }
          if (values.term && terms.indexOf(values.term.toUpperCase()) === -1) {
            this.addWatchForm.get('term').setErrors({'missing': true});
          } else {
            this.addWatchForm.get('term').setErrors(null);
          }

        });
  }

  addWatch(params) {
    this.databaseService.addWatch(params as Watch);
  }
}

@Pipe({name: 'prefix'})
export class PrefixPipe implements PipeTransform {
  transform(values: Observable<string[]>, query: string): Observable<string[]> {
    // A trie here would be nice, but somewhat overkill.
    return values.map(
        v => v.filter(x => x.toLowerCase().startsWith(query.toLowerCase())));
  }
}
