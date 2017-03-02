import { Base } from './base';
import { Period } from 'app/period';

export const UniversityOfChicago: Base = {
    name: 'UChicago',
    theme: 'uchicago',
    periods: [
        <Period> { name: 'Autumn', shorthand: 'F', color: '#FFA319' },
        <Period> { name: 'Winter', shorthand: 'W', color: '#155F83' },
        <Period> { name: 'Spring', shorthand: 'S', color: '#8A9045' },
        <Period> { name: 'Summer', shorthand: 'S', color: '#8F3931' },
    ],
    getDepartment(id: string): string {
        return id.substring(0, 4);
    },
    getOrdinal(id: string): number {
        return parseInt(id.substring(5), 10);
    },
    isWildcard(id: string): boolean {
        return id.length < 10;
    },
    getPaddedWildcard(id: string): string {
        return (id + 'xxxx').substring(0, 10);
    },
    isValid(id: string): boolean {
        return id.length <= 10 && /^[A-Z]{4} \d*/.test(id);
    },
    termToOrdinal(term: string): number {
        return UniversityOfChicago.periods.findIndex(x => term.startsWith(x.name)) + parseInt(term.substring(term.length - 4)) * 4;
    },
    termFromOrdinal(value: number): string {
        return UniversityOfChicago.periods[value % 4].name + " " + Math.floor(value / 4);
    }
};
