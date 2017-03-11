import { TranscriptRecord } from './transcript-record';

export class Transcript {
  static deserialize(data: any[]): Transcript {
    return new Transcript(data.map(TranscriptRecord.deserialize));
  }

  constructor(public records: TranscriptRecord[] = []) { }

  get terms(): string[] {
    const seen = new Set<string>();
    return this.records.map(r => r.term).reduce((accumulator, value) => {
      if (!seen.has(value)) {
        seen.add(value);
        accumulator.push(value);
      }
      return accumulator;
    }, []);
  }

  getTermTranscript(term: string) { return new Transcript(this.records.filter(r => r.term === term)); }

  getFilteredGpa(filter: (record: TranscriptRecord) => boolean) {
    const filtered = this.records.filter(r => r.quality).filter(filter);
    return filtered.length ? filtered.reduce((sum, record) => sum + record.gpa, 0) / filtered.length : 0;
  }

  getCumulativeGpa(term: string) {
    let visited = false; // true if we've visited the target term.
    let total = 0.0;
    let count = 0;
    for (let record of this.records) {
      if (record.term === term) {
        visited = true;
      } else if (visited) { // Now on the quarter after the desired term.
        break;
      }
      if (record.quality) {
        total += record.gpa;
        count++;
      }
    }
    return count ? total / count : 0;
  }

  getTotalGpa() { return this.getCumulativeGpa(this.records[this.records.length - 1].term); }
}
