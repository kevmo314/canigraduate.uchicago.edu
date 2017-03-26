import {Activity} from './activity';

export interface Section {
  id: string;
  department: string;
  term: string;
  notes: string[];
  primaries: Activity[];
  secondaries: Activity[];
}
