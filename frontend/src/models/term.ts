import { DocumentReference, DocumentData } from '@firebase/firestore-types';
import Terms from './terms';
import Sections from './sections';

export default class Term {
  public readonly period: string;
  public readonly year: number;
  constructor(
    private readonly ref: DocumentReference,
    { period, year }: DocumentData,
  ) {
    this.period = period;
    this.year = year;
  }

  get sections() {
    return new Sections(this.ref.collection('sections'));
  }
}
