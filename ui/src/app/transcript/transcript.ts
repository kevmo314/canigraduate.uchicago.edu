import { TranscriptRecord } from './transcript-record';

export class Transcript {
  /** A list of records, assumed to be chronologically ordered. */
  constructor(private _records: TranscriptRecord[]) {}

  get records() { return this._records; }

  get terms(): string[] {
    const seen = new Set<string>();
    return this._records.map(r => r.term).reduce((accumulator, value) => {
      if (!seen.has(value)) {
        seen.add(value);
        accumulator.push(value);
      }
      return accumulator;
    }, []);
  }

  static deserialize(data: any): Transcript {
    return new Transcript(data.map(TranscriptRecord.deserialize));
  }
}
