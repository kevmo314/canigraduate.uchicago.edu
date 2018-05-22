import { DocumentReference } from "@firebase/firestore-types";
import { Observable } from "rxjs";
import publishDocument from "./publishDocument";

export interface WatchData {
  readonly email: string;
  readonly course: string;
  readonly term: string;
  readonly section?: string;
}

export default class Watch {
  private readonly ref: DocumentReference;
  constructor(ref: DocumentReference) {
    this.ref = ref;
  }

  data(): Observable<WatchData> {
    return publishDocument(this.ref) as Observable<WatchData>;
  }
}
