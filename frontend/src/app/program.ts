import {DatabaseService} from 'app/database/database.service';
import {Transcript} from 'app/transcript';
import {TranscriptRecord} from 'app/transcript-record';
import {environment} from 'environments/environment';

export class Leaf {
  requirement: string;
  satisfier?: string;
  force: boolean;
}

export class Node {
  min?: number;
  max?: number;
  metadata?: {catalog: string};
  requirements: (Node|Leaf|string)[];
  force: boolean;
  hide: boolean;
  progress: number;
  total: number;
}

export class Program extends Node {
  name: string;
  ready: Promise<void>;

  static compare(a: Program, b: Program) {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  }

  private static satisfiesRequirement(id: string, specification: string) {
    if (specification.indexOf(':') === -1) {
      return id === specification;
    }
    const inst = environment.institution;
    return specification.split(':')[1].split(',').every(expression => {
      if (expression.startsWith('>=')) {
        return inst.getDepartment(id) ===
            inst.getDepartment(expression.substring(2)) &&
            inst.getOrdinal(id) >= inst.getOrdinal(expression.substring(2));
      }
      if (expression.startsWith('>')) {
        return inst.getDepartment(id) ===
            inst.getDepartment(expression.substring(1)) &&
            inst.getOrdinal(id) > inst.getOrdinal(expression.substring(1));
      }
      if (expression.startsWith('<=')) {
        return inst.getDepartment(id) ===
            inst.getDepartment(expression.substring(2)) &&
            inst.getOrdinal(id) <= inst.getOrdinal(expression.substring(2));
      }
      if (expression.startsWith('<')) {
        return inst.getDepartment(id) ===
            inst.getDepartment(expression.substring(1)) &&
            inst.getOrdinal(id) < inst.getOrdinal(expression.substring(1));
      }
      if (expression.startsWith('!')) {
        return inst.getDepartment(id) !==
            inst.getDepartment(expression.substring(1)) ||
            inst.getOrdinal(id) !== inst.getOrdinal(expression.substring(1));
      }
      throw new Error('Invalid expression "' + expression + '".');
    });
  }

  private isLeaf(requirement: Node|Leaf): requirement is Leaf {
    return requirement.hasOwnProperty('requirement');
  }

  private async evaluateChild(requirement: Node|Leaf, state: Set<string>):
      Promise<{progress: number, total: number}> {
    if (this.isLeaf(requirement)) {
      // This is a leaf.
      await this.evaluateLeaf(requirement, state);
      return {
        progress: (requirement.force || requirement.satisfier) ? 1 : 0,
        total: 1
      };
    }
    return this.evaluateNode(requirement, state);
  }

  private async evaluateLeaf(leaf: Leaf, state: Set<string>): Promise<void> {
    // For each course in the state, check if any of the crosslistings for that
    // course satisfy the requirement specified in this node. Because
    // crosslistings form equivalence classes, only one child will succeed.
    let resolved = false;
    return new Promise<void>((resolve, reject) => {
      for (const course of Array.from(state)) {
        if (Program.satisfiesRequirement(course, leaf.requirement)) {
          resolved = true;
          state.delete(leaf.satisfier = course);
          resolve();
          return;
        }
      }
      Promise
          .all(Array.from(state).map(
              course =>
                  this.databaseService.crosslists(course).first().subscribe(
                      result => {
                        for (const crosslist of (result || [])) {
                          if (Program.satisfiesRequirement(
                                  crosslist, leaf.requirement)) {
                            resolved = true;
                            state.delete(leaf.satisfier = course);
                            resolve();
                            return;
                          }
                        }
                      })))
          .then(() => {
            if (!resolved) {
              resolve();
            }
          });
    });
  }

  private async evaluateNode(node: Node, state: Set<string>):
      Promise<{progress: number, total: number}> {
    if (!node.requirements) {
      // This is a metadata leaf node that doesn't require progression.
      return <{progress: number, total: number}>node;
    }
    let t0 = performance.now();
    // The list of child progress objects.
    let progressions = [];
    // The raw number of child nodes completed.
    let childrenCompleted = 0;
    // The number of courses required to complete this subtree.
    let total = 0;
    // QueryList is supposed to extend Iterable but for some reason it doesn't.
    for (let i = 0; i < node.requirements.length; i++) {
      let result =
          await this.evaluateChild(<Node|Leaf>node.requirements[i], state);
      if (i < (node.min || node.requirements.length)) {
        total += result.total;
      }
      progressions.push(result);
      if (result.progress === result.total &&
          (++childrenCompleted === (node.max || node.requirements.length))) {
        break;
      }
    }
    progressions.sort((a, b) => b.progress - a.progress);
    node.total = total;
    node.progress = node.force ?
        node.total :
        progressions.reduce((sum, x) => sum + x.progress, 0);
    // Only set hide to true explicitly.
    if (node.progress >= (node.min || node.requirements.length)) {
      node.hide = true;
    }
    return <{progress: number, total: number}>node;
  }

  evaluate(transcript: Transcript): Promise<Set<TranscriptRecord>> {
    // TODO: Remove records that are in the same crosslist equivalence class.
    const coursesTaken = new Set(transcript.records.map(r => r.id));
    return this.evaluateNode(this, coursesTaken).then(() => {
      // The courses used are those that no longer appear in coursesTaken.
      return new Set(transcript.records.filter(r => !coursesTaken.has(r.id)));
    });
  }

  async preprocess(node: Node): Promise<void> {
    let promises = [];
    for (let i = 0; i < node.requirements.length; i++) {
      if (typeof node.requirements[i] === 'string') {
        const requirement = <string>node.requirements[i];
        // Convert ths node to a leaf.
        if (requirement.startsWith('/')) {
          promises.push(
              this.databaseService.sequence(requirement.substring(1))
                  .first()
                  .subscribe(graft => {
                    graft.hide = graft.metadata && graft.metadata['hide'];
                    return this.preprocess(node.requirements[i] = graft);
                  }));
        } else {
          node.requirements[i] = <Leaf>{requirement: node.requirements[i]};
        }
      } else {
        promises.push(this.preprocess(<Node>node.requirements[i]));
      }
    }
    return Promise.all(promises).then(() => null);
  }

  constructor(private databaseService: DatabaseService) {
    super();
  }

  finalize(): Program {
    this.ready = this.preprocess(this);
    return this;
  }
}
