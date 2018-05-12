import { Observable } from 'rxjs';
import { DocumentReference } from '@firebase/firestore-types';
import publishDocument from './publishDocument';

interface SequenceData {
  readonly name: string;
  readonly description: string;
}

export default class Sequence {
  private readonly ref: DocumentReference;
  constructor(ref: DocumentReference) {
    this.ref = ref;
  }

  data(): Observable<SequenceData> {
    return publishDocument(this.ref) as Observable<SequenceData>;
  }
}
