import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';

const NUM_ELEMENTS = 9;

@Component({
  selector: 'cig-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  @Input() items: number;
  @Input() pageSize: number;
  @Input() page: number;
  @Output() pageChange = new EventEmitter();

  get pages() {
    const lastPage = this.getLastPage();
    const range = (start, stop) =>
        Array.from(new Array((stop - start) + 1), (_, i) => i + start);
    const left =
        Math.max(0, this.page - 4 + Math.min(0, lastPage - 4 - this.page));
    const bounds = range(left, Math.min(lastPage, left + NUM_ELEMENTS - 1));
    if (bounds[0] > 0) {
      bounds[0] = 0;
      bounds[1] = -1;
    }
    if (bounds[NUM_ELEMENTS - 1] < lastPage) {
      bounds[NUM_ELEMENTS - 1] = lastPage;
      bounds[NUM_ELEMENTS - 2] = -1;
    }
    return bounds;
  }

  getLastPage() {
    return Math.max(0, Math.floor((this.items - 1) / this.pageSize));
  }
}