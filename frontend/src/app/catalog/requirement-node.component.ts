import { DatabaseService } from 'app/database/database.service';
import { Component, Input, QueryList, ViewChildren, OnInit, AfterViewInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Node, Leaf } from 'app/program';

@Component({
  selector: 'cig-requirement-node',
  templateUrl: './requirement-node.component.html',
  styleUrls: ['./requirement-node.component.css']
})
export class RequirementNodeComponent {
  @Input() requirement: Node;
  @Input() root = false;

  @ViewChildren('subnode') subnodes: QueryList<RequirementNodeComponent>;

  /** Toggles the visibility of this node. */
  toggle() {
    // QueryList's don't have .every() implemented yet.
    if (this.subnodes && this.subnodes.reduce((prev, child) => prev && child.hide === this.hide, true)) {
      this.subnodes.forEach(x => x.toggle());
    }
    this.hide = !this.hide;
  }

  get hide() {
    return this.requirement.hide;
  }
  set hide(value: boolean) {
    this.requirement.hide = value;
  }

  isLeaf(child: Node | Leaf | string): boolean {
    return child.hasOwnProperty('requirement');
  }

  get minRequire() {
    return this.requirement.min || this.requirement.requirements.length;
  }

  get complete(): boolean {
    return this.requirement.progress >= this.minRequire;
  }
}
