import { Transcript } from '../transcript/transcript';
import { TranscriptRecord } from '../transcript/transcript-record';
import { DatabaseService } from 'app/database/database.service';
import { Component, Input, QueryList, ViewChildren, OnInit, AfterViewInit } from '@angular/core';
import { CrosslistInvariantPrefixMultiSet } from 'app/course-info/crosslist-invariant-prefix-multi-set';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'cig-requirement-node',
  templateUrl: './requirement-node.component.html',
  styleUrls: ['./requirement-node.component.css']
})
export class RequirementNodeComponent implements OnInit, AfterViewInit {
  @Input() requirement: any;
  @Input() root: boolean = false;

  force: boolean = false;
  completedChildren: number = 0;
  hide: boolean = false;
  private _initPromise: Promise<void>;
  protected _initResolver: () => void;

  @ViewChildren('child') children: QueryList<RequirementNodeComponent>;

  constructor(private databaseService: DatabaseService) {
    this._initPromise = new Promise<void>((resolve, reject) => {
      this._initResolver = resolve;
    });
  }

  ngOnInit() {
    if (!this.requirement) {
      throw new Error('Attribute "requirement" is required');
    }
  }

  ngAfterViewInit() {
    // If it's a string, then it's a reference node, so graft it in.
    (typeof this.requirement === 'string' ? this.databaseService.object(this.requirement.substring(1)) : Observable.of(this.requirement))
      .subscribe(node => {
      this.requirement = node;
      this._initResolver();
      this.hide = (this.requirement.metadata && this.requirement.metadata.hide);
    });
  }

  /** Toggles the visibility of this node. */  
  toggle() {
    if (this.children) {
      // QueryList's don't have .every() implemented yet.
      if (this.children.reduce((prev, child) => prev && child.hide === this.hide, true)) {
        this.children.forEach(x => x.toggle());
      }
    }
    this.hide = !this.hide;
  }

  isLeaf(child: any): boolean {
    return typeof child === 'string' && !child.startsWith('/');
  }

  get complete(): boolean {
    return this.completedChildren >= this.minRequire;
  }

  /** The lowest number of courses that can satisfy this node. */
  get minRequire(): number {
    if (this.requirement.min) {
      return this.requirement.min;
    }
    if (this.requirement.requirements) {
      return this.requirement.requirements.length;
    }
    return 0;
  }

  /**
   * Greedily identify the best possible completion path for this component. This function will
   * not return the partial results (even if they are rendered), instead returning an "all or nothing"
   * behavior.
   * 
   * TODO: This can possibly be extended to return an iterator that returns progression proposals.
   * 
   * @param {Transcript} transcript the original transcript.
   * @param {Set<string>} state a set representing the current progression state.
   */
  evaluateTranscriptRecords(
      transcript: Transcript,
      state: Set<string>): Promise<{ progress: number, total: number }> {
    return this._initPromise.then(() => {
      if (!this.children) {
        // This is a metadata leaf node that doesn't require progression.
        return { progress: 0, total: 0 };
      }
      // The list of child progress objects.
      let progressions = [];
      // The raw number of child nodes completed.
      this.completedChildren = 0;
      // The number of courses required to complete this subtree.
      let total = 0;
      const children = this.children.toArray();
      // QueryList is supposed to extend Iterable but for some reason it doesn't.
      const evaluateChildAtIndex = (index: number) => {
        if (index === this.children.length) {
          return Promise.resolve();
        }
        return children[index].evaluateTranscriptRecords(transcript, state).then(result => {
          if (index < (this.requirement.min || this.children.length)) {
            total += result.total;
          }
          progressions.push(result);
          if (result.progress === result.total && (++this.completedChildren === (this.requirement.max || this.children.length))) {
            // We've exceeded the max limit for completed children, so stop evaluating here.
            return;
          } else {
            // Evaluate the next child.
            return evaluateChildAtIndex(index + 1);
          }
        });
      };
      return evaluateChildAtIndex(0).then(() => {
        progressions.sort((a, b) => b.progress - a.progress);
        let progress = this.force ? total : progressions.reduce((sum, x) => sum + x.progress, 0);
        // Only set hide to true explicitly.
        if (this.complete) {
          this.hide = true;
        }
        return { progress, total };
      });
    });
  }
}
