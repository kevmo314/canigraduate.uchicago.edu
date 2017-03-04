import { Leaf } from 'app/program';
import { Component, Input } from '@angular/core';
import { DatabaseService } from 'app/database/database.service';
import { Observable } from 'rxjs/Observable';
import { Memoize } from 'typescript-memoize';
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
export class RequirementLeafComponent {
  @Input() requirement: Leaf;

  get complete() {
    return !!this.requirement.satisfier;
  }

  get isExplicitRequirement() {
    return this.requirement.requirement.indexOf(':') === -1;
  }

  get displayName() {
    const index = this.requirement.requirement.indexOf(':');
    return this.requirement.requirement.substring(0, index === -1 ? this.requirement.requirement.length : index);
  }
}
