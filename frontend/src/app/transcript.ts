import {Memoize} from 'typescript-memoize';
import {TranscriptRecord} from './transcript-record';

export class Transcript {
  static deserialize(data: any[]): Transcript {
    return new Transcript(data.map(TranscriptRecord.deserialize));
  }

  constructor(public records: TranscriptRecord[] = []) {}

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

  @Memoize()
  getTermTranscript(term: string) {
    return new Transcript(this.records.filter(r => r.term === term));
  }

  getFilteredGpa(filter: (record: TranscriptRecord) => boolean) {
    const filtered = this.records.filter(r => r.quality).filter(filter);
    return filtered.length ?
        filtered.reduce((sum, record) => sum + record.gpa, 0) /
            filtered.length :
        0;
  }

  @Memoize()
  getCumulativeTranscript(term: string) {
    return new Transcript(
        this.records.slice(0, this.records.findIndex((element, index) => {
          return index > 0 && this.records[index - 1].term === term &&
              element.term !== term;
        })));
  }

  getCumulativeGpa(term: string) {
    return this.getCumulativeTranscript(term).getTotalGpa();
  }

  getTotalGpa() {
    const records = this.records.filter(record => record.quality);
    return records.reduce((a, b) => a + b.gpa, 0) / records.length;
  }
}
