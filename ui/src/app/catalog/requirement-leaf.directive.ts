import { TranscriptRecord } from '../transcript/transcript-record';
import { Transcript } from '../transcript/transcript';
import { Directive, Input } from '@angular/core';
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
@Directive({ selector: '[cigRequirementLeaf]', exportAs: 'cigRequirementLeaf' })
export class RequirementLeafDirective extends RequirementNodeComponent {
  @Input() requirement: string;

  satisfier: string = null;
  force: boolean = false;

  constructor(
    private courseInfoService: CourseInfoService,
    private angularFire: AngularFire) {
    super();
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
      state: Set<string>): Promise<{progress: number, total: number}> {
    if (this.isExplicitRequirement) {
      if (state.has(this.requirement)) {
        state.delete(this.satisfier = this.requirement);
        return Promise.resolve(this.progress);
      }
      return this.courseInfoService.lookup(this.requirement).toPromise().then(result => {
        for (let crosslist of result.crosslists) {
          if (state.has(crosslist)) {
            // The list of classes has a crosslisted course.
            state.delete(this.satisfier = crosslist);
            return this.progress;
          }
        }
        return this.progress;
      });
    } else {
      // For each course in the state, check if any of the crosslistings for that course
      // satisfy the requirement specified in this node. Because crosslistings form
      // equivalence classes, only one child will succeed.
      // TODO: Consolidate this with the above code.
      return new Promise((resolve, reject) => {
        let resolved = false;
        Promise.all(Array.prototype.map.call(state, course => 
          this.courseInfoService.lookup(course).toPromise().then(result => {
            if (resolved) { return; }
            for (let crosslist of result.crosslists) {
              if (this.satisfiesRequirement(crosslist)) {
                state.delete(this.satisfier = course);
                resolved = true;
                resolve(this.progress);
                return;
              }
            }
          })
        )).then(() => {
          if (!resolved) {
            resolve(this.progress);
          }
        });
      });
    }
  }
}
