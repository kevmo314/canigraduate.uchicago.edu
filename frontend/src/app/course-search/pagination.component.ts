import { Component, EventEmitter, Output, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'cig-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
    private _page;

    @Input() items: number;
    @Input() pageSize: number;

    @Output() pageChange = new EventEmitter();

    get pages() {
        const range = (start, stop) => Array.from(
            new Array((stop - start) + 1),
            (_, i) => i + start
        );
        const left = Math.max(0, this._page - 5);
        return range(left, Math.min(this.getLastPage(), left + 10));
    }

    getLastPage() {
        return Math.max(0, Math.floor((this.items - 1) / this.pageSize));
    }

    @Input()
    get page() {
        return this._page;
    }

    set page(value) {
        this.pageChange.emit(this._page = Math.max(Math.min(value, this.getLastPage()), 0));
    }
}