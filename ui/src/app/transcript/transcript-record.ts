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
}
