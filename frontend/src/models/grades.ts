import { Observable } from 'rxjs';
import {
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  CollectionReference,
} from '@firebase/firestore-types';
import { map } from 'rxjs/operators';
import Section from './section';
import { HOST } from './functions';
import axios from 'axios';

export default class Grades {
  private readonly ref: CollectionReference;

  constructor(ref: CollectionReference) {
    this.ref = ref;
  }
}
