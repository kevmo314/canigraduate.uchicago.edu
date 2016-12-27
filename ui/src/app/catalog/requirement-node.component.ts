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
  async evaluateTranscriptRecords(transcript: Transcript, state: CrosslistInvariantPrefixMultiSet): Promise<{progress: number, remaining: number}> {
    if (!this.requirement) {
      // This is a metadata leaf node that doesn't require progression.
      return {progress: 0, remaining: 0};
    }
    // The list of child progress objects.
    let progressions = [];
    // The raw number of child nodes completed.
    let completedChildren = 0;
    // The number of courses required to complete this subtree.
    let total = 0;
    for (let childRequirement of this.requirement) {
      let {progress: childProgress, remaining: childRemaining} = await childRequirement.evaluateTranscriptRecords(transcript, state);
    }
  }

}
