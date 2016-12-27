import { TranscriptRecord } from '../transcript/transcript-record';
import { Transcript } from '../transcript/transcript';
import { Directive, Input } from '@angular/core';
import { CourseInfoService } from 'app/course-info/course-info.service';
import { Observable } from 'rxjs/Observable';
import { AngularFire, FirebaseObjectObservable } from 'angularfire2';
import { Memoize } from 'typescript-memoize';
import { RequirementNodeComponent } from './requirement-node.component';
import { CrosslistInvariantPrefixMultiSet } from 'app/course-info/crosslist-invariant-prefix-multi-set';

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

  get paddedId(): string {
    // [UCHICAGO-SPECIFIC]
    return (this.id + 'xxxx').substring(0, 10);
  }

  get id(): string {
    // [UCHICAGO-SPECIFIC]
    return this.requirement.startsWith('>') ? this.requirement.substring(1, 7) : this.requirement;
  }

  /** true if the current node is intended for wildcard matching. */
  get isWildcardElective(): boolean {
    // [UCHICAGO-SPECIFIC]
    return this.requirement.length !== 10;
  }

  /**
   * Check if this leaf node is satisfied by the current state.
   * 
   * @param {Transcript} transcript the original transcript.
   * @param {CrosslistInvariantPrefixMultiSet} state a set representing the current progression state.
   */
  async evaluateTranscriptRecords(
      transcript: Transcript,
      state: CrosslistInvariantPrefixMultiSet): Promise<{progress: number, remaining: number}> {
    let index = await state.indexOf(this.id);
    if (index < 0 && this.id.length === 6 && this.id.endsWith('2')) {
      // Edge case, also check 3xxxx courses for 2xxxx wildcards.
      index = await state.indexOf(this.id.substring(0, 5) + '3');
    }
    if (index > -1) {
      // A course satisfies this node, so get the course and remove it from the multiset.
      state.delete(this.satisfier = state.get(index));
    }
    return {progress: this.satisfier || this.force ? 1 : 0, remaining: 1};
  }
}
