import { Component, Input, EventEmitter, Output } from '@angular/core';

export class ChipToggleChange {
    source: ChipToggleComponent;
    checked: boolean;
}

@Component({
    selector: 'cig-chip-toggle',
    templateUrl: './chip-toggle.component.html',
    styleUrls: ['./chip-toggle.component.css']
})
export class ChipToggleComponent {
    @Input() public color: string = 'default';
    @Input() public checked: boolean = false;
    @Input() public disabled: boolean = false;
    @Output() public change: EventEmitter<ChipToggleChange> = new EventEmitter<ChipToggleChange>();
}