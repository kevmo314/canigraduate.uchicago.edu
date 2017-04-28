import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'cig-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  @Input() items: number;
  @Input() pageSize: number;
  @Input() page: number;
  @Output() pageChange = new EventEmitter();

  get pages() {
    const range = (start, stop) =>
        Array.from(new Array((stop - start) + 1), (_, i) => i + start);
    const left = Math.max(0, this.page - 5);
    return range(left, Math.min(this.getLastPage(), left + 10));
  }

  getLastPage() {
    return Math.max(0, Math.floor((this.items - 1) / this.pageSize));
  }
}