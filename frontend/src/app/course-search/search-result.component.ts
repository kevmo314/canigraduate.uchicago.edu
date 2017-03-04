import { DatabaseService } from 'app/database/database.service';
import { Component, Input, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';
import { Filters } from 'app/filters';

@Component({
  selector: 'cig-search-result',
  templateUrl: './search-result.component.html',
  styleUrls: ['./search-result.component.css']
})
export class SearchResultComponent implements AfterViewInit {
  @Input() course: string;

  constructor(private databaseService: DatabaseService) { }

  ngAfterViewInit() {
    if (!this.course) {
      throw new Error('course parameter must be specified');
    }
  }

  getCrosslists(id: string) {
    return this.databaseService.courseInfo(id).map(info => (info['crosslists'] || []).join(', '));
  }
}
