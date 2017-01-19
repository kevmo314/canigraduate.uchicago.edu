/**
 * A single transcript record.
 *
 * Do not add any class methods to this object, as it is deserialized via
 * typecasting.
 */
export class TranscriptRecord {
  id: string;
  complete: boolean;
  gpa: number;
  grade: string;
  quality: boolean;
  section: string;
  term: string;

  static deserialize(data: any): TranscriptRecord {
    return <TranscriptRecord>data;
  }

  static compare(a: TranscriptRecord, b: TranscriptRecord): number {
    if (a.id < b.id) { return -1; }
    if (a.id > b.id) { return 1; }
    return 0;
  }
}
