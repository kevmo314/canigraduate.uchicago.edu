import { environment } from 'environments/environment';

export const Term = {
  compare(a: string, b: string): number {
    return environment.institution.termToOrdinal(a) - environment.institution.termToOrdinal(b);
  }
};    
