import {
  DocumentReference,
  DocumentData,
  DocumentSnapshot,
} from '@firebase/firestore-types';
import { Observable } from 'rxjs/Observable';
import { map, filter } from 'rxjs/operators';
import publishDocument from './publishDocument';

interface PrimaryActivityData {
  readonly instructors: string[];
  readonly location: string;
  readonly schedule: [number, number][];
  readonly type: string;
}

interface SecondaryActivityData {
  readonly id: string;
  readonly instructors: string[];
  readonly location: string;
  readonly schedule: [number, number][];
  readonly type: string;
  readonly enrollment: EnrollmentData;
}

interface EnrollmentData {
  readonly enrolled?: number;
  readonly maximum?: number;
}

interface SectionData {
  readonly enrollment: EnrollmentData;
  readonly notes: string[];
  readonly primaries: PrimaryActivityData[];
  readonly secondaries: SecondaryActivityData[];
}

const SECONDS_PER_DAY = 86400;

function parseSchedule(blocks: number[]) {
  return blocks.map(block => {
    const from = Math.floor(block / (86400 * 60));
    const to = Math.floor((block % 86400) / 60);
    return [from, to] as [number, number];
  });
}

export default class Section {
  private readonly ref: DocumentReference;
  constructor(ref: DocumentReference) {
    this.ref = ref;
  }

  data(): Observable<SectionData> {
    return publishDocument(this.ref).pipe(
      filter(Boolean),
      map(data => {
        return {
          ...data,
          primaries: data.primaries.map(
            primary =>
              ({
                ...primary,
                schedule: parseSchedule(primary.schedule),
              } as PrimaryActivityData),
          ),
          secondaries: data.secondaries.map(
            secondary =>
              ({
                ...secondary,
                schedule: parseSchedule(secondary.schedule),
              } as SecondaryActivityData),
          ),
        } as SectionData;
      }),
    );
  }
}
