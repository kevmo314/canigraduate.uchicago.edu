import { DocumentReference, DocumentData } from '@firebase/firestore-types';
import Terms from './terms';

export default class Course {
  public readonly name: string;
  public readonly description: string;
  public readonly priority: number;
  public readonly crosslists: string[];
  public readonly notes: string[];
  constructor(
    private readonly ref: DocumentReference,
    { name, description, priority, crosslists, notes }: DocumentData,
  ) {
    this.name = name;
    this.description = description;
    this.priority = priority;
    this.crosslists = crosslists;
    this.notes = notes;
  }

  get terms() {
    return new Terms(this.ref.collection('terms'));
  }
}
