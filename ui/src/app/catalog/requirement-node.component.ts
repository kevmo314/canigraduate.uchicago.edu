import { Transcript } from '../transcript/transcript';
import { TranscriptRecord } from '../transcript/transcript-record';
import { Component, Input, QueryList, ViewChildren } from '@angular/core';
import { CrosslistInvariantPrefixMultiSet } from 'app/course-info/crosslist-invariant-prefix-multi-set';

@Component({
  selector: 'cig-requirement-node',
  templateUrl: './requirement-node.component.html',
  styleUrls: ['./requirement-node.component.css']
})
export class RequirementNodeComponent {
  @Input() requirement: any;

  force: boolean = false;
  complete: boolean = false;
  hide: boolean = false;

  @ViewChildren(RequirementNodeComponent) children: QueryList<RequirementNodeComponent>;

  get isLeaf(): boolean {
    return typeof this.requirement === 'string';
  }

  /**
   * Greedily identify the best possible completion path for this component. This function will
   * not return the partial results (even if they are rendered), instead returning an "all or nothing"
   * behavior.
   * 
   * TODO: This can possibly be extended to return an iterator that returns progression proposals.
   * 
   * @param {Transcript} transcript the original transcript.
   * @param {CrosslistInvariantPrefixMultiSet} state a set representing the current progression state.
   */
  async evaluateTranscriptRecords(
      transcript: Transcript,
      state: CrosslistInvariantPrefixMultiSet): Promise<{progress: number, remaining: number}> {
    const children = this.requirement.requirements;
    if (!children) {
      // This is a metadata leaf node that doesn't require progression.
      return {progress: 0, remaining: 0};
    }
    // The list of child progress objects.
    let progressions = [];
    // The raw number of child nodes completed.
    let completedChildren = 0;
    // The number of courses required to complete this subtree.
    let total = 0;
    for (let i = 0; i < children.length; i++) {
      let child = await children[i].evaluateTranscriptRecords(transcript, state);
      // If the index is less than the min count, add that node's requirement count to the cap
      // to accumulate how many classes we need to finish this node.
      if (i < (this.requirement.min || children.length)) {
        total += child.progress + child.remaining;
      }
      progressions.push(child);
      if (child.remaining === 0 && (++completedChildren === (this.requirement.max || children.length))) {
        // We've exceeded the max limit for completed children, so stop here.
        break;
      }
    }
    progressions.sort((a, b) => b.progress - a.progress);
    let progress = this.force ? total : progressions.reduce((sum, x) => sum + x.progress, 0);
    this.complete = (completedChildren >= (this.requirement.min || children.length));
    // Only set hide to true explicitly, otherwise it's whatever metadata.hide is set to.
    this.hide = this.complete || this.requirement.metadata.hide;
    return {progress: progress, remaining: total - progress};
  }

}
