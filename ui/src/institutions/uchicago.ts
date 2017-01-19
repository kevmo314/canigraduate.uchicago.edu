import { Base } from './base';

export const UniversityOfChicago: Base = {
    name: 'UChicago',
    theme: 'uchicago',
    terms: [
        { name: 'Autumn', shorthand: 'F', color: '#FFA319' },
        { name: 'Winter', shorthand: 'W', color: '#155F83' },
        { name: 'Spring', shorthand: 'S', color: '#8A9045' },
        { name: 'Summer', shorthand: 'S', color: '#8F3931' },
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
    }
};
