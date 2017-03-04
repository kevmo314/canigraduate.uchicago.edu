import { Period } from 'app/period';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { environment } from 'environments/environment';

const SUNDAY = [0 * 24 * 60, 1 * 24 * 60];
const MONDAY = [1 * 24 * 60, 2 * 24 * 60];
const TUESDAY = [2 * 24 * 60, 3 * 24 * 60];
const WEDNESDAY = [3 * 24 * 60, 4 * 24 * 60];
const THURSDAY = [4 * 24 * 60, 5 * 24 * 60];
const FRIDAY = [5 * 24 * 60, 6 * 24 * 60];
const SATURDAY = [6 * 24 * 60, 7 * 24 * 60];

export class Filters {
    private _periods: Set<Period> = new Set<Period>(environment.institution.periods);
    private _changes: ReplaySubject<Filters> = new ReplaySubject<Filters>(1);

    // TODO: It would be nice if this were an interval tree. The previous version had
    // this, however the new structure requires that we add delete, which hasn't been
    // implemented. All of the interval tree libraries I found are also shit.
    excludedTimes = [SUNDAY, SATURDAY];
    instructors = new Set<string>();
    departments = new Set<string>();
    query = '';
    taken = false;
    tested = false;
    prequisites = false;
    core = false;

    private setExcludedInterval(x, value) {
        const index = this.getExcludedInterval(x);
        if (value && index === -1) {
            this.excludedTimes.push(x);
        } else if (!value && index > -1) {
            this.excludedTimes.splice(index, 1);
        }
        console.log(this.excludedTimes);
    }

    private getExcludedInterval(x) {
        return this.excludedTimes.findIndex(y => y[0] === x[0] && y[1] === x[1]);
    }

    // Monday should return true if the entire day of the week is not excluded.
    get monday() { return this.getExcludedInterval(MONDAY) === -1; }
    set monday(value) { debugger; this.setExcludedInterval(MONDAY, value); }
    get tuesday() { return this.getExcludedInterval(TUESDAY) === -1; }
    set tuesday(value) { this.setExcludedInterval(TUESDAY, value); }
    get wednesday() { return this.getExcludedInterval(WEDNESDAY) === -1; }
    set wednesday(value) { this.setExcludedInterval(WEDNESDAY, value); }
    get thursday() { return this.getExcludedInterval(THURSDAY) === -1; }
    set thursday(value) { this.setExcludedInterval(THURSDAY, value); }
    get friday() { return this.getExcludedInterval(FRIDAY) === -1; }
    set friday(value) { this.setExcludedInterval(FRIDAY, value); }
    get saturday() { return this.getExcludedInterval(SATURDAY) === -1; }
    set saturday(value) { this.setExcludedInterval(SATURDAY, value); }
    get sunday() { return this.getExcludedInterval(SUNDAY) === -1; }
    set sunday(value) { this.setExcludedInterval(SUNDAY, value); }

    getPeriodFilter(x: Period): boolean { return this._periods.has(x); }
    setPeriodFilter(x: Period, value: boolean) {
        if (value) {
            this._periods.add(x);
        } else {
            this._periods.delete(x);
        }
        this._changes.next(this);
    }

    /** Returns an observable that emits the latest version of the filters. */
    get changes(): Observable<Filters> {
        return this._changes;
    }

    get selector(): PouchDB.Find.Selector {
        return {
            'period': { $in: Array.from(this._periods).map(p => p.name) }
        };
    }
}