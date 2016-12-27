import { Directive, Input } from '@angular/core';
import { CourseInfoService } from 'app/course-info/course-info.service';
import { Observable } from 'rxjs/Observable';
import { AngularFire, FirebaseObjectObservable } from 'angularfire2';
import { Memoize } from 'typescript-memoize';

/**
 * Requirement leaf directive to provide rendering helper functions.
 * Core logic regarding requirement satisfaction resides in RequirementNodeComponent.
 */
@Directive({ selector: '[cigRequirementLeaf]', exportAs: 'cigRequirementLeaf' })
export class RequirementLeafDirective {
  @Input() requirement: string;

  constructor(private courseInfoService: CourseInfoService,
  private angularFire: AngularFire) {}

  get id(): string {
    // [UCHICAGO-SPECIFIC]
    if (this.requirement.startsWith('>')) {
      return (this.requirement.substring(1, 7) + 'xxxxx').substring(0, 10);
    } else {
      return (this.requirement + 'xxxxx').substring(0, 10);
    }
  }

  /** true if the current node is intended for wildcard matching. */
  get isWildcardElective(): boolean {
    // [UCHICAGO-SPECIFIC]
    return this.requirement.length !== 10;
  }
}
