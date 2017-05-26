import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cig-grades-histogram',
  templateUrl: 'grades-histogram.component.html',
  styleUrls: ['./grades-histogram.component.scss']
})
export class GradesHistogramComponent implements OnChanges {
  @Input() grades: {grade: string, count: number}[];
  total = 0;
  max = 0;
  median = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes.grades && this.grades) {
      this.total = this.grades.reduce((sum, grade) => sum + grade.count, 0);
      this.max =
          this.grades.reduce((max, grade) => Math.max(max, grade.count), 0);
      let count = 0;
      for (const grade of this.grades) {
        count += grade.count;
        if (count * 2 > this.total) {
          this.median = grade.grade;
          break;
        }
      }
    }
  }
}
