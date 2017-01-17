export const enum DayOfWeek {
    Monday = 1 << 0,
    Tuesday = 1 << 1,
    Wednesday = 1 << 2,
    Thursday = 1 << 3,
    Friday = 1 << 4,
    Saturday = 1 << 5,
    Sunday = 1 << 6,
    Weekdays = Monday | Tuesday | Wednesday | Thursday | Friday,
    Weekends = Saturday | Sunday
}

export class Filters {
    private _dayOfWeek: DayOfWeek = DayOfWeek.Weekdays;

    constructor() { }

    // Template helper functions...
    private getDayOfWeekBit(x: DayOfWeek): boolean { return (this._dayOfWeek & x) > 0; }
    private setDayOfWeekBit(x: DayOfWeek, value: boolean) {
        this._dayOfWeek ^= (-value ^ this._dayOfWeek) & x;
    }
    get monday() { return this.getDayOfWeekBit(DayOfWeek.Monday); }
    set monday(value) { this.setDayOfWeekBit(DayOfWeek.Monday, value); }
    get tuesday() { return this.getDayOfWeekBit(DayOfWeek.Tuesday); }
    set tuesday(value) { this.setDayOfWeekBit(DayOfWeek.Tuesday, value); }
    get wednesday() { return this.getDayOfWeekBit(DayOfWeek.Wednesday); }
    set wednesday(value) { this.setDayOfWeekBit(DayOfWeek.Wednesday, value); }
    get thursday() { return this.getDayOfWeekBit(DayOfWeek.Thursday); }
    set thursday(value) { this.setDayOfWeekBit(DayOfWeek.Thursday, value); }
    get friday() { return this.getDayOfWeekBit(DayOfWeek.Friday); }
    set friday(value) { this.setDayOfWeekBit(DayOfWeek.Friday, value); }
    get saturday() { return this.getDayOfWeekBit(DayOfWeek.Saturday); }
    set saturday(value) { this.setDayOfWeekBit(DayOfWeek.Saturday, value); }
    get sunday() { return this.getDayOfWeekBit(DayOfWeek.Sunday); }
    set sunday(value) { this.setDayOfWeekBit(DayOfWeek.Sunday, value); }
}