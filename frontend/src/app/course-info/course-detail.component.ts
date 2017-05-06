import {ChangeDetectionStrategy, Component, Input, OnChanges, Pipe, PipeTransform, SimpleChanges} from '@angular/core';
import {AuthenticationService} from 'app/authentication/authentication.service';
import {DatabaseService} from 'app/database/database.service';
import {Evaluation} from 'app/evaluation';
import {Section} from 'app/section';
import {Observable} from 'rxjs/Observable';
import {Memoize} from 'typescript-memoize';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cig-course-detail',
  templateUrl: 'course-detail.component.html',
  styleUrls: ['./course-detail.component.scss']
})
export class CourseDetailComponent implements OnChanges {
  @Input() course: string;

  // Do not store the index directly to ensure consistent behavior if new data
  // arrives.
  private lastTerm = null;
  terms: string[] = [];
  evaluations: Observable<Evaluation[]>;
  authenticationValidated: Observable<boolean>;
  @Input() sections: Section[] = [];

  constructor(
      private databaseService: DatabaseService,
      private authenticationService: AuthenticationService) {
    this.authenticationService.credentials.map(x => x.validated);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.sections && this.sections) {
      const termList = this.sections.map(x => x.term);
      this.terms = Array.from(new Set<string>(termList).values());
      if (this.terms.length > 0) {
        // Show around 10 courses.
        this.lastTerm = termList[Math.min(termList.length, 10) - 1];
      }
    }
    if (changes.course && this.course) {
      this.evaluations = this.databaseService.evaluations(this.course);
    }
  }

  sectionsByTerm(term: string) {
    return this.sections.filter(x => x.term === term);
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
