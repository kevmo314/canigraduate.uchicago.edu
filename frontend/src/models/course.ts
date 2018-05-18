import { Observable } from 'rxjs';
import { DocumentReference } from '@firebase/firestore-types';
import publishDocument from './publishDocument';
import Institution from './institution';
import { map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import Term from './term';

interface CourseData {
  readonly name: string;
  readonly description: string;
  readonly priority: number;
  readonly crosslists: string[];
  readonly notes: string[];
  readonly sequence?: string;
  readonly terms: string[];
}

export default class Course {
  private readonly ref: DocumentReference;
  private readonly institution: Institution;

  constructor(institution: Institution, ref: DocumentReference) {
    this.ref = ref;
    this.institution = institution;
  }

  data(): Observable<CourseData> {
    return combineLatest(
      publishDocument(this.ref),
      this.institution.data().pipe(map(institution => institution.periods)),
      (courseData: CourseData, periods) => {
        if (!courseData) {
          return null;
        }
        function termToOrdinal(term: string) {
          const index = periods.findIndex(period =>
            term.startsWith(period.name),
          );
          const year = parseInt(term.substring(term.length - 4), 10) * 4;
          return (index + 3) % 4 + year;
        }
        return {
          ...courseData,
          terms: courseData.terms.sort(
            (a, b) => termToOrdinal(b) - termToOrdinal(a),
          ),
        } as CourseData;
      },
    );
  }

  get terms() {
    return this.data().pipe(map(data => data.terms));
  }

  term(id: string) {
    return new Term(this.ref.collection('terms').doc(id));
  }
}
