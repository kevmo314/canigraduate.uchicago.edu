import { DatabaseService } from '../database/database.service';
import { FormControl } from '@angular/forms';
import { environment } from '../../environments/environment';
import { Filters } from './filters';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { MdButtonToggleChange } from '@angular/material';
import { Course } from 'app/course';
import { Period } from 'app/period';
<<<<<<< HEAD
import { DatabaseService } from 'app/database/database.service';
=======
import { Observable } from 'rxjs/Observable';
>>>>>>> 8a8f39224bd6875919edb163b9992cea23a53096

@Component({
  selector: 'cig-course-search',
  templateUrl: './course-search.component.html',
  styleUrls: ['./course-search.component.css']
})
export class CourseSearchComponent implements AfterViewInit, OnInit {
  filters: Filters = new Filters();
  periods: Period[] = environment.institution.periods;
  results: Course[] = [];
  instructors: string[] = [];
  departments: string[] = [];

  instructorControl = new FormControl();
  departmentControl = new FormControl();
  filteredInstructors: Observable<string[]>;
  filteredDepartments: Observable<string[]>;

  ngOnInit() {
    this.databaseService.instructors.subscribe(instructors => this.instructors = instructors);
    this.filteredInstructors = this.instructorControl.valueChanges.map(value => this.searchInstructors(value));
    this.databaseService.departments.subscribe(departments => this.departments = departments);
    this.filteredDepartments = this.departmentControl.valueChanges.map(value => this.searchDepartments(value));
  }

  ngAfterViewInit() {
    this.filters.changes.subscribe(filters => {
      // Search the database using these filters.
      console.log('changes!', filters);
      this.databaseService.schedules(filters);
    });

  }

  constructor(private databaseService: DatabaseService) { }

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
    }
  }

  private searchInstructors(value): string[] {
    const targets = value.toLowerCase().split(' ');
    return this.instructors.filter(instructor => {
      const match = instructor.toLowerCase();
      return !this.filters.instructors.has(instructor) && targets.every(target => match.indexOf(target) > -1);
    }).sort();
  }

  private searchDepartments(value): string[] {
    return this.departments.filter(department => {
      return !this.filters.departments.has(department) && department.toLowerCase().indexOf(value) > -1;
    }).sort();
  }
}
