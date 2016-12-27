import { CourseInfoService } from '../course-info/course-info.service';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'cig-requirement-node',
  templateUrl: './requirement-node.component.html',
  styleUrls: ['./requirement-node.component.css']
})
export class RequirementNodeComponent {
  @Input() requirement: any;

  get isLeaf(): boolean {
    return typeof this.requirement === 'string';
  }
}
