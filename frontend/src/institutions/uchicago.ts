import {Period} from 'app/period';

import {Base} from './base';

export const UniversityOfChicago: Base = {
  name: 'University of Chicago',
  theme: 'uchicago',
  periods: [
    <Period>{name: 'Autumn', shorthand: 'F', color: '#FFA319'},
    <Period>{name: 'Winter', shorthand: 'W', color: '#155F83'},
    <Period>{name: 'Spring', shorthand: 'S', color: '#8A9045'},
    <Period>{name: 'Summer', shorthand: 'S', color: '#8F3931'},
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
  splitTerm(term: string): [Period, number] {
    return [
      UniversityOfChicago.getPeriod(term), UniversityOfChicago.getYear(term)
    ];
  },
  joinTerm(period: Period, year: number): string {
    return `${period.name} ${year}`;
  },
  getPeriod(term: string): Period {
    return UniversityOfChicago.periods.find(
        period => period.name === term.substring(0, 6));
  },
  getYear(term: string): number {
    return parseInt(term.substring(7, 11), 10);
  },
  termToOrdinal(term: string): number {
    return UniversityOfChicago.periods.findIndex(x => term.startsWith(x.name)) +
        parseInt(term.substring(term.length - 4), 10) * 4;
  },
  termFromOrdinal(value: number): string {
    return UniversityOfChicago.periods[value % 4].name + ' ' +
        Math.floor(value / 4);
  }
};
