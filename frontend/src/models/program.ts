import { Observable, combineLatest, of } from 'rxjs';
import {
  DocumentReference,
  CollectionReference,
} from '@firebase/firestore-types';
import publishDocument from './publishDocument';
import publishIndex from './publishIndex';
import { map, flatMap } from 'rxjs/operators';

interface ProgramData {
  readonly requirements: string;
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

export default class Program {
  private readonly ref: DocumentReference;
  private readonly subprogramsRef: CollectionReference;
  constructor(ref: DocumentReference, subprogramsRef: CollectionReference) {
    this.ref = ref;
    this.subprogramsRef = subprogramsRef;
  }

  data(): Observable<ProgramData> {
    const data = publishDocument(this.ref);
    return combineLatest(
      data,
      data.pipe(
        flatMap(({ requirements }) => this.parse(JSON.parse(requirements))),
      ),
    ).pipe(
      map(([data, requirements]) => {
        return { ...data, requirements } as ProgramData;
      }),
    );
  }

  /**
   * Produces a tree with all subprograms resolved.
   * @param requirements
   */
  resolve(requirements: any[]): Observable<any[]> {
    // Considering only this requirement tree level.
    return combineLatest(
      requirements.map(node => {
        if (typeof node == 'string') {
          if (node.startsWith('subprograms')) {
            // Resolve the subprogram.
            return publishDocument(this.subprogramsRef.doc(node)).pipe(
              flatMap(({ requirements }) =>
                this.resolve(JSON.parse(requirements)),
              ),
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
      this.ref.collection('extensions').doc(id),
      this.subprogramsRef,
    );
  }
}
