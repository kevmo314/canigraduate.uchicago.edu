import { DatabaseService } from 'app/database/database.service';
import { Filters } from 'app/filters';
import { Observable } from 'rxjs/Observable';
import { Component, Input, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cig-course-detail',
  templateUrl: 'course-detail.component.html',
  styleUrls: ['./course-detail.component.scss']
})
export class CourseDetailComponent implements AfterViewInit {
  @Input() course: string;
  @Input() filters: Filters;

  // Do not store the index directly to ensure consistent behavior if new data arrives.
  private lastTerm = null;
  terms: string[] = [];
  sections: Observable<any>;

  constructor(private databaseService: DatabaseService) { }

  ngAfterViewInit() {
    this.sections = this.databaseService.sections(this.course, this.filters);
    this.sections.subscribe(data => {
      this.terms = Array.from(new Set<string>(data.map(x => x.term)).values());
      if (this.terms.length > 0) {
        this.lastTerm = this.terms[0];
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
