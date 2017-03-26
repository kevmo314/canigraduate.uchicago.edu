import {AfterViewInit, ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {DatabaseService} from 'app/database/database.service';
import {Filters} from 'app/filters';
import {Observable} from 'rxjs/Observable';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cig-course-detail',
  templateUrl: 'course-detail.component.html',
  styleUrls: ['./course-detail.component.scss']
})
export class CourseDetailComponent implements AfterViewInit {
  @Input() course: string;
  @Input() filters: Filters;

  // Do not store the index directly to ensure consistent behavior if new data
  // arrives.
  private lastTerm = null;
  terms: string[] = [];
  sections: Observable<any>;

  constructor(private databaseService: DatabaseService) {}

  ngAfterViewInit() {
    this.sections = this.databaseService.sections(this.course, this.filters);
    this.sections.subscribe(data => {
      const termList = data.map(x => x.term);
      this.terms = Array.from(new Set<string>(termList).values());
      if (this.terms.length > 0) {
        // Show around 10 courses.
        this.lastTerm = termList[Math.min(termList.length, 10) - 1];
      }
    });
  }

  sectionsByTerm(term: string) {
    return this.sections.map(data => data.filter(x => x.term === term));
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
