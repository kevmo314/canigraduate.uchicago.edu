import {AfterViewInit, Component, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MdButtonToggleChange} from '@angular/material';
import {DatabaseService} from 'app/database/database.service';
import {Filters} from 'app/filters';
import {Period} from 'app/period';
import {environment} from 'environments/environment';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';

@Component({
  selector: 'cig-course-search',
  templateUrl: './course-search.component.html',
  styleUrls: ['./course-search.component.scss']
})
export class CourseSearchComponent implements AfterViewInit, OnInit {
  filters: Filters = new Filters();
  periods: Period[] = environment.institution.periods;
  results: string[] = [];
  instructors: string[] = [];
  departments: string[] = [];
  page = 0;
  queryTime = 0;


  instructorControl = new FormControl();
  departmentControl = new FormControl();
  filteredInstructors: Observable<string[]>;
  filteredDepartments: Observable<string[]>;

  shown = new Set<string>();

  ngOnInit() {
    this.databaseService.instructors.subscribe(
        instructors => this.instructors = instructors);
    this.filteredInstructors = this.instructorControl.valueChanges.map(
        value => this.searchInstructors(value));
    this.databaseService.departments.subscribe(
        departments => this.departments = departments);
    this.filteredDepartments = this.departmentControl.valueChanges.map(
        value => this.searchDepartments(value));
  }

  ngAfterViewInit() {
    this.filters.changes.subscribe(filters => {
      // Search the database using these filters.
      console.log(filters);
      const start = new Date().getTime();
      this.databaseService.courses(filters).then(results => {
        this.results = results;
        this.queryTime = new Date().getTime() - start;
      });
    });
  }

  constructor(private databaseService: DatabaseService) {}

  addInstructor(value) {
    const results = this.searchInstructors(value);
    if (results.length > 0) {
      this.filters.instructors.add(results[0]);
    }
  }

  addDepartment(value) {
    const results = this.searchDepartments(value);
    if (results.length > 0) {
      this.filters.departments.add(results[0]);
      this.filters.emitChange();
    }
  }

  private searchInstructors(value): string[] {
    const targets = value.toLowerCase().split(' ');
    return this.instructors
        .filter(instructor => {
          const match = instructor.toLowerCase();
          return !this.filters.instructors.has(instructor) &&
              targets.every(target => match.indexOf(target) > -1);
        })
        .sort();
  }

  private searchDepartments(value): string[] {
    return this.departments
        .filter(department => {
          return !this.filters.departments.has(department) &&
              department.toLowerCase().indexOf(value) > -1;
        })
        .sort();
  }
}
