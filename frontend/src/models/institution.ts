import { Observable } from 'rxjs/Observable';
import { DocumentReference, DocumentData } from '@firebase/firestore-types';
import { map } from 'rxjs/operators';
import Courses from './courses';
import firestore from './firestore';

export default class Institution {
  public readonly name: string;
  constructor(private readonly ref: DocumentReference, { name }: DocumentData) {
    this.name = name;
  }

  get courses() {
    return new Courses(this.ref.collection('courses'));
  }
}
