import { DocumentReference, DocumentData } from '@firebase/firestore-types';

interface PrimaryActivity {
  readonly instructors: string[];
  readonly location: string;
  readonly schedule: number[];
  readonly type: string;
}

interface SecondaryActivity {
  readonly id: string;
  readonly instructors: string[];
  readonly location: string;
  readonly schedule: number[];
  readonly type: string;
  readonly enrollment: Enrollment;
}

interface Enrollment {
  readonly enrolled?: number;
  readonly maximum?: number;
}

export default class Section {
  public readonly enrollment: Enrollment;
  public readonly notes: string[];
  public readonly primaries: PrimaryActivity[];
  public readonly secondaries: SecondaryActivity[];
  constructor(
    private readonly ref: DocumentReference,
    { enrollment, notes, primaries, secondaries }: DocumentData,
  ) {
    this.enrollment = enrollment;
    this.notes = notes;
    this.primaries = primaries;
    this.secondaries = secondaries;
  }
}
