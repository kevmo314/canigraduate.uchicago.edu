import { CollectionReference } from "@firebase/firestore-types";

export default class Grades {
  private readonly ref: CollectionReference;

  constructor(ref: CollectionReference) {
    this.ref = ref;
  }
}
