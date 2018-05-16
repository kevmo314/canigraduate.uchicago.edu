import { Observable, combineLatest, of } from 'rxjs';
import {
  DocumentReference,
  CollectionReference,
} from '@firebase/firestore-types';
import publishDocument from './publishDocument';
import publishIndex from './publishIndex';
import { map, tap, switchMap } from 'rxjs/operators';
import Institution from './institution';

interface ProgramData {
  readonly requirements: ProgramData[];
  readonly min: number;
  readonly max: number;
}

interface ProgressData {
  readonly remaining: number;
  readonly completed: number;
}

/** LiftedData stores all the stateful information associated with a program. */
interface LiftedData {
  requirements: LiftedData[];
  program: ProgramData | string;
  progress: ProgressData;
  force: boolean;
  satisfier?: string;
}

function display(node) {
  if (node.min && node.max) {
    if (node.min == node.max) {
      if (node.min > 1) {
        return 'Exactly ' + node.min + ' of the following';
      }
    } else {
      return (
        'At least ' +
        node.min +
        ' and at most ' +
        node.max +
        ' of the following'
      );
    }
  } else if (node.min && node.min > 1) {
    return 'At least ' + node.min + ' of the following';
  }
}

function grouping(node) {
  if (node.min == node.max && node.min == 1) {
    return 'OR';
  } else if (node.min && node.min == 1) {
    return 'OR';
  } else {
    return 'ALL';
  }
}

function* extractSubprograms(node) {
  if (typeof node == 'string' && node.startsWith('subprograms')) {
    yield node;
  } else if (node instanceof Array) {
    for (const child of node) {
      yield* extractSubprograms(child);
    }
  } else if (typeof node == 'object') {
    yield* extractSubprograms(node.requirements);
  }
}

function satisfies(specification, course) {
  if (specification.indexOf(':') === -1) {
    return course == specification;
  }
  // Just for convenience
  const parse = x => [x.substring(0, 4), parseInt(x.substring(5), 10)];
  return specification
    .split(':')[1]
    .split(',')
    .every(expression => {
      const [courseDepartment, courseOrdinal] = parse(course);
      if (expression.startsWith('>=')) {
        const [department, ordinal] = parse(expression.substring(2));
        return courseDepartment == department && courseOrdinal >= ordinal;
      }
      if (expression.startsWith('>')) {
        const [department, ordinal] = parse(expression.substring(1));
        return courseDepartment == department && courseOrdinal > ordinal;
      }
      if (expression.startsWith('<=')) {
        const [department, ordinal] = parse(expression.substring(2));
        return courseDepartment == department && courseOrdinal <= ordinal;
      }
      if (expression.startsWith('<')) {
        const [department, ordinal] = parse(expression.substring(1));
        return courseDepartment == department && courseOrdinal < ordinal;
      }
      if (expression.startsWith('!')) {
        return expression.substring(1) != course;
      }
      throw new Error('Invalid expression "' + expression + '".');
    });
}

function leafResolver(node: LiftedData, courses: string[][]): LiftedData {
  const i = courses.findIndex(crosslists =>
    crosslists.some(c => satisfies(node.program, c)),
  );
  return {
    ...node,
    progress:
      i > -1 ? { completed: 1, remaining: 0 } : { completed: 0, remaining: 1 },
    satisfier: i > -1 ? courses.splice(i, 1)[0][0] : null,
  };
}

function nodeResolver(node: LiftedData, courses: string[][]): LiftedData {
  // The list of child progress objects.
  const program = node.program as ProgramData;
  let complete = 0;
  for (let i = 0; i < node.requirements.length; i++) {
    const { progress } = resolve(node.requirements[i], courses);
    if (!progress.remaining && !progress.completed) {
      // Remove any degenerate nodes that cannot count towards progress.
      continue;
    } else if (!progress.remaining && ++complete == program.max) {
      // This child is completed, so stop iterating to prevent pulling unnecessary courses.
      // Technically future subtrees could cause unnecessarily taken courses to be marked,
      // but we'll just ignore that for now...
      break;
    }
  }
  // Sort by number of courses remaining ascending to catch the edge case of future subtrees being completed.
  const minimumRequirements = node.requirements
    .slice()
    .sort((a, b) => a.progress.remaining - b.progress.remaining)
    .slice(0, program.min);
  const remaining = minimumRequirements
    .map(child => child.progress.remaining)
    .reduce((a, b) => a + b, 0);
  const completed = minimumRequirements
    .map(child => child.progress.completed)
    .reduce((a, b) => a + b, 0);
  return {
    ...node,
    progress: {
      remaining: node.force ? 0 : remaining,
      completed,
    },
  };
}

function resolve(node: LiftedData, courses: string[][]): LiftedData {
  if (typeof node.program === 'string') {
    return leafResolver(node, courses);
  } else if (node.requirements) {
    return nodeResolver(node, courses);
  } else {
    return { ...node, progress: { completed: 0, remaining: 0 } };
  }
}

export default class Program {
  private readonly institution: Institution;
  private readonly ref: DocumentReference;
  private readonly subprogramsRef: CollectionReference;
  constructor(
    institution: Institution,
    ref: DocumentReference,
    subprogramsRef: CollectionReference,
  ) {
    this.institution = institution;
    this.ref = ref;
    this.subprogramsRef = subprogramsRef;
  }

  data(): Observable<ProgramData> {
    const data = publishDocument(this.ref);
    return combineLatest(
      data,
      data.pipe(
        switchMap(({ requirements }) => this.parse(JSON.parse(requirements))),
      ),
    ).pipe(
      map(([data, requirements]) => {
        return { ...data, requirements } as ProgramData;
      }),
    );
  }

  bindTranscript(records: any[]): Observable<LiftedData> {
    const crosslistedRecords = combineLatest(
      records.filter(record => record.quality).map(record =>
        this.institution
          .course(record.course)
          .data()
          .pipe(
            map(
              data => [record.course, ...(data.crosslists || [])] as string[],
            ),
          ),
      ),
    );
    return combineLatest(
      this.data().pipe(
        map(function lift(program: ProgramData): LiftedData {
          return {
            requirements: program.requirements
              ? program.requirements.map(requirement => lift(requirement))
              : null,
            program,
            progress: {} as ProgressData,
          } as LiftedData;
        }),
      ),
      crosslistedRecords,
    ).pipe(
      map(([lifted, crosslistedRecords]) =>
        resolve(lifted, crosslistedRecords.slice()),
      ),
    );
  }

  /**
   * Produces a tree with all subprograms resolved.
   * @param requirements
   */
  resolve(requirements: any[] | string): Observable<ProgramData[]> {
    if (typeof requirements === 'string') {
      // For convenience, requirements may be a string.
      requirements = [requirements];
    }
    // Considering only this requirement tree level.
    return combineLatest(
      requirements.map(node => {
        if (typeof node === 'string') {
          if (node.startsWith('subprograms')) {
            // Resolve the subprogram.
            return publishDocument(
              this.subprogramsRef.doc(node.split('/')[1]),
            ).pipe(
              switchMap(result => {
                if (!result) {
                  console.error('Could not resolve subprogram: ' + node);
                  return of({ display: 'Specification error' });
                }
                return this.resolve(JSON.parse(result.requirements)).pipe(
                  map(requirements => ({
                    display: result.display,
                    requirements,
                  })),
                );
              }),
            );
          } else {
            return of(node);
          }
        } else if (node.requirements) {
          return this.resolve(node.requirements).pipe(
            map(requirements => ({ ...node, requirements })),
          );
        } else {
          return of(node);
        }
      }),
    );
  }

  addMetadata(node: any) {
    if (typeof node == 'string' || !node.requirements) {
      return node;
    }
    return {
      display: display(node),
      grouping: grouping(node),
      min: node.requirements.length,
      max: node.requirements.length,
      ...node,
      requirements: node.requirements.map(child => this.addMetadata(child)),
    };
  }

  parse(requirements: any[]): Observable<any[]> {
    return this.resolve(requirements).pipe(
      map(requirements => {
        return requirements.map(node => this.addMetadata(node));
      }),
    );
  }

  get extensions(): Observable<string[]> {
    return publishIndex(this.ref.collection('extensions'));
  }

  extension(id: string): Program {
    return new Program(
      this.institution,
      this.ref.collection('extensions').doc(id),
      this.subprogramsRef,
    );
  }
}
