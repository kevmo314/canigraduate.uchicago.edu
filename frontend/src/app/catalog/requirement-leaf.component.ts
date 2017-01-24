import { TranscriptRecord } from '../transcript/transcript-record';
import { Transcript } from '../transcript/transcript';
import { Component, Input, AfterViewInit } from '@angular/core';
import { DatabaseService } from 'app/database/database.service';
import { CourseInfoService } from 'app/course-info/course-info.service';
import { Observable } from 'rxjs/Observable';
import { AngularFire, FirebaseObjectObservable } from 'angularfire2';
import { Memoize } from 'typescript-memoize';
import { RequirementNodeComponent } from './requirement-node.component';
import { CrosslistInvariantPrefixMultiSet } from 'app/course-info/crosslist-invariant-prefix-multi-set';
import { environment } from 'environments/environment';

/**
 * Requirement leaf directive to provide rendering helper functions.
 * Core logic regarding requirement satisfaction resides in RequirementNodeComponent.
 */
@Component({
  selector: 'cig-requirement-leaf',
  templateUrl: './requirement-leaf.component.html',
  styleUrls: ['./requirement-leaf.component.css']
})
export class RequirementLeafComponent extends RequirementNodeComponent implements AfterViewInit {
  @Input() requirement: string;

  satisfier: string = null;
  force: boolean = false;

  constructor(
    databaseService: DatabaseService,
    private courseInfoService: CourseInfoService,
    private angularFire: AngularFire) {
    super(databaseService);
  }

  ngAfterViewInit() {
    this._initResolver();
  }

  get complete(): boolean {
    return this.satisfier !== null;
  }

  get displayName(): string {
    if (this.isExplicitRequirement) {
      return this.requirement;
    }
    return this.requirement.substring(0, this.requirement.indexOf(':'));
  }

  get isExplicitRequirement(): boolean {
    return this.requirement.indexOf(':') === -1;
  }

  private get progress(): {progress: number, total: number} {
    return {progress: this.satisfier || this.force ? 1 : 0, total: 1};
  }

  /**
   * Check if a given course id satisfies the requirement specified in this leaf node.
   */
  private satisfiesRequirement(id: string): boolean {
    const inst = environment.institution;
    return this.requirement.split(':')[1].split(',').every(expression => {
        if (expression.startsWith('>=')) {
          return inst.getDepartment(id) === inst.getDepartment(expression.substring(2)) &&
            inst.getOrdinal(id) >= inst.getOrdinal(expression.substring(2));
        }
        if (expression.startsWith('>')) {
          return inst.getDepartment(id) === inst.getDepartment(expression.substring(1)) &&
            inst.getOrdinal(id) > inst.getOrdinal(expression.substring(1));
        }
        if (expression.startsWith('<=')) {
          return inst.getDepartment(id) === inst.getDepartment(expression.substring(2)) &&
            inst.getOrdinal(id) <= inst.getOrdinal(expression.substring(2));
        }
        if (expression.startsWith('<')) {
          return inst.getDepartment(id) === inst.getDepartment(expression.substring(1)) &&
            inst.getOrdinal(id) < inst.getOrdinal(expression.substring(1));
        }
        if (expression.startsWith('!')) {
          return inst.getDepartment(id) !== inst.getDepartment(expression.substring(1)) ||
            inst.getOrdinal(id) !== inst.getOrdinal(expression.substring(1));
        }
        throw new Error('Invalid expression "' + expression + '".');
      }
    );
  }

  /**
   * Check if this leaf node is satisfied by the current state.
   * 
   * @param {Transcript} transcript the original transcript.
   * @param {Set<string>} state a set representing the current progression state.
   */
  evaluateTranscriptRecords(
      transcript: Transcript,
      state: Set<string>): Promise<{ progress: number, total: number }> {
    return new Promise((resolve, reject) => {
      if (this.isExplicitRequirement) {
        if (state.has(this.requirement)) {
          state.delete(this.satisfier = this.requirement);
          return resolve(this.progress);
        }
        this.courseInfoService.lookup(this.requirement).first().subscribe(result => {
          for (let crosslist of (result.crosslists || [])) {
            if (state.has(crosslist)) {
              // The list of classes has a crosslisted course.
              state.delete(this.satisfier = crosslist);
              break;
            }
          }
          resolve(this.progress);
        });
      } else {
        // For each course in the state, check if any of the crosslistings for that course
        // satisfy the requirement specified in this node. Because crosslistings form
        // equivalence classes, only one child will succeed.
        // TODO: Consolidate this with the above code.
        let resolved = false;
        Promise.all(Array.from(state).sort().map(course => {
          if (resolved) { return; }
          if (this.satisfiesRequirement(course)) {
            state.delete(this.satisfier = course);
            resolved = true;
            return resolve(this.progress);
          }
          this.courseInfoService.lookup(course).first().subscribe(result => {
            if (resolved) { return; }
            for (let crosslist of (result.crosslists || [])) {
              if (this.satisfiesRequirement(crosslist)) {
                state.delete(this.satisfier = course);
                resolved = true;
                resolve(this.progress);
                break;
              }
            }
          });
        })).then(() => {
          if (!resolved) {
            resolve(this.progress);
          }
        });
      }
    });
  }
}
