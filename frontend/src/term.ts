import { environment } from 'environments/environment';

type Term = string;
class Term {
    name: string;

    static compare(a: Term, b: Term): number {
        return environment.institution.termToOrdinal(a.name) - environment.institution.termToOrdinal(b.name);
    }
}