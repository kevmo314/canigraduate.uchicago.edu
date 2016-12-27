import { CourseInfoService } from './course-info.service';

/**
 * A MultiSet<string> that is invariant to crosslistings.
 */
export class CrosslistInvariantPrefixMultiSet {
  private data: string[];
  private courseInfoService: CourseInfoService;
  constructor(courseInfoService: CourseInfoService, data: string[]) {
    this.data = data.slice().sort();
  }

  get size() {
    return this.data.length;
  }

  clear() { this.data.length = 0; }

  async delete(record: string) {
    let index: number = await this.indexOf(record);
    if (index > -1) {
      this.data.splice(index, 1);
    }
  }

  async has(value: string): Promise<boolean> { return await this.indexOf(value) > -1; }

  get(index: number) { return this.data[index]; }

  async indexOf(value: string): Promise<number> {
    let index = this.prefixBinarySearch(value);
    if (index > -1) {
      return Promise.resolve(index);
    } else {
      return this.crosslistSearch(value);
    }
  }

  private prefixBinarySearch(value: string): number {
    let start = 0; let end = this.data.length - 1; let mid = -1; let el = null;
    while (start < end) {
      mid = (start + (end - start) / 2);
      el = this.data[mid];
      if (el > value) {
        end = mid;
      } else {
        start = mid + 1;
      }
    }
    return this.data[end].startsWith(value) ? end : -1;
  }

  private async crosslistSearch(value: string): Promise<number> {
    return Promise.all(this.data.map(x => this.courseInfoService.lookup(x).toPromise())).then(crosslists => {
      for (let i = 0; i < crosslists.length; i++) {
        for (let crosslist of crosslists[i].crosslists) {
          if (crosslist.startsWith(value)) {
            return i;
          }
        }
      }
      return -1;
    });
  }
}
