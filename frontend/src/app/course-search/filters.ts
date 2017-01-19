import { Term } from 'institutions/base';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { environment } from 'environments/environment';

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
    private _terms: Set<Term> = new Set<Term>(environment.institution.terms);
    private _changes: ReplaySubject<Filters> = new ReplaySubject<Filters>(1);

    // Template helper functions...
    getDayOfWeekFilter(x: DayOfWeek): boolean { return (this._dayOfWeek & x) > 0; }
    setDayOfWeekFilter(x: DayOfWeek, value: boolean) {
        this._dayOfWeek ^= (-value ^ this._dayOfWeek) & x;
        this._changes.next(this);
    }

    getTermFilter(x: Term): boolean { return this._terms.has(x); }
    setTermFilter(x: Term, value: boolean) {
        (value ? this._terms.add : this._terms.delete)(x);
        this._changes.next(this);
    }

    /** Returns an observable that emits the latest version of the filters. */
    get changes(): Observable<Filters> {
        return this._changes;
    }
}