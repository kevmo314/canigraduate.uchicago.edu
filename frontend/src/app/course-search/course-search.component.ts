import {
  AfterViewInit,
  Component,
  OnInit,
  Pipe,
  PipeTransform,
  ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MdButtonToggleChange } from '@angular/material';
import { DatabaseService } from 'app/database/database.service';
import { Period } from 'app/period';
import { Section } from 'app/section';
import { Term } from 'app/term';
import { TranscriptService } from 'app/transcript/transcript.service';
import { environment } from 'environments/environment';
import { AssignAction, Store } from 'filnux';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { Memoize } from 'typescript-memoize';

import { CourseSearchModule } from './course-search.module';
import {
  ACTIONS,
  CourseSearchState,
  ToggleShownAction
} from './course-search.store';
import { FiltersComponent } from './filters/filters.component';
import { FiltersModule } from './filters/filters.module';
import { FiltersState } from './filters/filters.store';

@Component({
  selector: 'cig-course-search',
  templateUrl: './course-search.component.html',
  styleUrls: ['./course-search.component.scss']
})
export class CourseSearchComponent implements AfterViewInit {
  page: Observable<number>;
  resultsPerPage: Observable<number>;
  queryTime = 0;
  store: any;

  @ViewChild(FiltersComponent) filtersComponent: FiltersComponent;

  filters: Observable<FiltersState>;
  results: Observable<string[]>;
  count = new Subject<number>();

  constructor(
    private databaseService: DatabaseService,
    private transcriptService: TranscriptService
  ) {
    this.store = new Store<CourseSearchState>({
      initialState: new CourseSearchState()
    }).addActions(ACTIONS);
  }

  ngAfterViewInit() {
    this.page = this.store.select(s => s.page);
    this.resultsPerPage = this.store.select(s => s.resultsPerPage);
    this.filters = this.filtersComponent.store.select(x => x);
  }

  setPage(page: number) {
    this.store.dispatch(new AssignAction<CourseSearchState>({ page }));
  }
}
