export class TranscriptRecord {
  id: string;
  complete: boolean;
  gpa: number;
  grade: string;
  quality: boolean;
  section: string;
  term: string;

  static deserialize(data: any): TranscriptRecord {
    return Object.assign(new TranscriptRecord(), data);
  }

  static compare(a: TranscriptRecord, b: TranscriptRecord): number {
    if(a.id < b.id) { return -1; }
    if(a.id > b.id) { return 1; }
    return 0;
  }
}
