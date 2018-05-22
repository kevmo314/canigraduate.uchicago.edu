import { DocumentReference } from "@firebase/firestore-types";
import { Observable } from "rxjs";
import { filter, map } from "rxjs/operators";
import publishDocument from "./publishDocument";

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6
}

interface ScheduleData {
  readonly day: DayOfWeek;
  readonly start: number;
  readonly end: number;
}

interface PrimaryActivityData {
  readonly instructors: string[];
  readonly location: string;
  readonly schedule: ScheduleData[];
  readonly type: string;
}

interface SecondaryActivityData {
  readonly id: string;
  readonly instructors: string[];
  readonly location: string;
  readonly schedule: ScheduleData[];
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
    const end = block % SECONDS_PER_DAY;
    block = Math.floor(block / SECONDS_PER_DAY);
    const start = block % SECONDS_PER_DAY;
    block = Math.floor(block / SECONDS_PER_DAY);
    return { day: block, start, end } as ScheduleData;
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
                schedule: parseSchedule(primary.schedule)
              } as PrimaryActivityData)
          ),
          secondaries: data.secondaries.map(
            secondary =>
              ({
                ...secondary,
                schedule: parseSchedule(secondary.schedule)
              } as SecondaryActivityData)
          )
        } as SectionData;
      })
    );
  }
}
