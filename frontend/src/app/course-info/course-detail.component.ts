import {AfterContentInit, ChangeDetectionStrategy, Component, HostListener, Input, OnChanges, OnDestroy, Pipe, PipeTransform, SimpleChanges, ViewChild} from '@angular/core';
import {AuthenticationService} from 'app/authentication/authentication.service';
import {DatabaseService} from 'app/database/database.service';
import {Evaluation} from 'app/evaluation';
import {Section} from 'app/section';
import {environment} from 'environments/environment';
import {Observable} from 'rxjs/Observable';
import Stickyfill from 'stickyfill';
import {Memoize} from 'typescript-memoize';

import {Term} from './../term';

const Sticky = Stickyfill();

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cig-course-detail',
  templateUrl: 'course-detail.component.html',
  styleUrls: ['./course-detail.component.scss'],
})
export class CourseDetailComponent implements OnChanges, AfterContentInit,
                                              OnDestroy {
  @Input() course: string;

  // Do not store the index directly to ensure consistent behavior if new data
  // arrives.
  private lastTerm = null;
  evaluations: Observable<Evaluation[]>;
  authenticationValidated: Observable<boolean>;
  grades: Observable<{grade: string, count: number}[]>;
  @Input() terms: string[] = [];

  @ViewChild('sticky') sticky;

  constructor(
      private databaseService: DatabaseService,
      private authenticationService: AuthenticationService) {
    this.authenticationService.credentials.map(x => x.validated);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.terms && this.terms) {
      if (this.terms.length > 0) {
        // Show around 5 courses.
        this.lastTerm = this.terms[Math.min(this.terms.length, 5) - 1];
      }
    }
    if (changes.course && this.course) {
      this.evaluations = this.databaseService.evaluations(this.course);
      this.grades = this.databaseService.gradeDistribution(this.course);
    }
  }

  ngAfterContentInit() {
    Sticky.add(this.sticky.nativeElement);
  }

  ngOnDestroy() {
    Sticky.remove(this.sticky.nativeElement);
  }

  sectionsByTerm(term: string) {
    const year = environment.institution.getYear(term);
    const period = environment.institution.getPeriod(term);
    return this.databaseService.schedules(this.course, year, period.name)
        .map(schedules => {
          const results = [];
          for (const sectionId of Object.keys(schedules)) {
            if (schedules[sectionId]) {
              results.push(
                  Object.assign({id: sectionId}, schedules[sectionId]) as
                  Section);
            }
          }
          return results.sort(
              (a, b) => -Term.compare(a.term, b.term) || -(a.id < b.id) ||
                  +(a.id !== b.id));
        });
  }

  get numTerms() {
    return this.lastTerm ? this.terms.indexOf(this.lastTerm) + 1 : 0;
  }

  showNextTerm() {
    this.lastTerm = this.terms[this.numTerms];
  }

  get description() {
    return this.databaseService.description(this.course);
  }
}

@Pipe({name: 'matchSection'})
export class MatchSectionPipe implements PipeTransform {
  transform(evaluations: Evaluation[], term: string, section: string):
      Evaluation {
    return (evaluations || []).find(evaluation => {
      return evaluation.term === term && evaluation.section === section;
    });
  }
}
