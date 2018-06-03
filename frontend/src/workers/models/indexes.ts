import * as base64js from "base64-js";
import TypedFastBitSet from "fastbitset";

function unpack(data: string): Uint32Array {
  const binary = base64js.toByteArray(data);
  const bits = binary[0];
  const values = new Uint32Array((binary.length - 1) / bits);
  for (let i = 1; i < binary.length; i += bits) {
    // Values are written little-endian.
    for (let j = bits - 1; j >= 0; j--) {
      values[(i - 1) / bits] <<= 8;
      values[(i - 1) / bits] |= binary[i + j] | 0;
    }
  }
  return values;
}

function build<T>(n: number, m: number): T[][] {
  const table = [];
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j < m; j++) {
      row.push(0);
    }
    table.push(row);
  }
  return table;
}

function toCardinalityTable(
  n: number,
  m: number,
  data: Uint32Array
): number[][] {
  const table = build<number>(n, m);
  for (let i = 0; i < data.length; ) {
    const cardinality = data[i];
    const count = data[i + 1];
    for (let j = 0; j < count; j++) {
      const packedIndex = data[i + j + 2];
      const courseIndex = (packedIndex / m) | 0;
      const termIndex = packedIndex % m;
      table[courseIndex][termIndex] = cardinality;
    }
    i += count + 2;
  }
  return table;
}

function toSectionsTable(cardinalityTable: number[][], sections: string[]) {
  let p = 0;
  return cardinalityTable.map(row => {
    return row.map(count => {
      return count == 0 ? null : sections.slice(p, (p += count));
    });
  });
}

function toTotalCardinality(table: number[][]): number {
  let sum = 0;
  for (let i = 0; i < table.length; i++) {
    for (let j = 0; j < table[j].length; j++) {
      sum += table[i][j];
    }
  }
  return sum;
}

function getOrUnpack(
  map: Map<string, TypedFastBitSet | string>,
  unpacker: (data: string) => TypedFastBitSet,
  key: string
) {
  if (!map.has(key)) {
    return new TypedFastBitSet();
  }
  const value = map.get(key);
  if (!(value instanceof TypedFastBitSet)) {
    const unpacked = unpacker(value);
    map.set(key, unpacked);
    return unpacked;
  }
  return value;
}

function keysWithoutMetadata<V>(map: Map<string, V>) {
  return Array.from(map.keys())
    .sort()
    .filter(key => key != "_metadata");
}

export default class Indexes {
  private readonly data: any;
  private readonly courses: string[];
  private readonly terms: string[];
  private readonly courseIndexes: Map<string, number>;
  private readonly termIndexes: Map<string, number>;
  private readonly sequences: Map<string, TypedFastBitSet | string>;
  private readonly departments: Map<string, TypedFastBitSet | string>;
  private readonly instructors: Map<string, TypedFastBitSet | string>;
  private readonly years: Map<string, TypedFastBitSet | string>;
  private readonly periods: Map<string, TypedFastBitSet | string>;
  private readonly enrollments: Map<string, TypedFastBitSet | string>;
  private readonly ages: Map<string, TypedFastBitSet | string>;
  private readonly sections: string[][][];
  private readonly cardinalityTable: number[][];
  private readonly courseOffsets: number[];
  private readonly totalCardinality: number;
  constructor(data: any) {
    // TODO: Would be nice to put these all in observables so they don't block the UI thread.
    this.courses = data.courses as string[];
    this.terms = data.terms as string[];
    this.courseIndexes = new Map<string, number>(
      this.courses.map((course, index) => [course, index] as [string, number])
    );
    this.termIndexes = new Map<string, number>(
      this.terms.map((term, index) => [term, index] as [string, number])
    );
    function parse(x) {
      return new Map<string, TypedFastBitSet | string>(Object.entries(x));
    }
    let start = performance.now();
    this.sequences = parse(data.sequences);
    this.departments = parse(data.departments);
    this.instructors = parse(data.instructors);
    this.years = parse(data.years);
    this.periods = parse(data.periods);
    this.enrollments = parse(data.enrollments);
    this.ages = parse(data.ages);
    this.cardinalityTable = toCardinalityTable(
      this.courses.length,
      this.terms.length,
      unpack(data.cardinalities)
    );
    this.totalCardinality = toTotalCardinality(this.cardinalityTable);
    const cardinalities = this.cardinalityTable.map(row =>
      row.reduce((a, b) => a + b, 0)
    );
    this.courseOffsets = [0];
    for (let i = 0; i < cardinalities.length; i++) {
      this.courseOffsets.push(this.courseOffsets[i] + cardinalities[i]);
    }
    this.sections = toSectionsTable(
      this.cardinalityTable,
      Array.from(unpack(data.sectionIds)).map(index => data.sections[index])
    );
  }

  getTotalCardinality() {
    return this.totalCardinality;
  }

  getCourses(): string[] {
    return this.courses;
  }

  getTerms(): string[] {
    return this.terms;
  }

  getSections(course: string, term: string) {
    const i = this.courses.indexOf(course);
    const j = this.terms.indexOf(term);
    return this.sections[i][j];
  }

  getCourseTermSections(
    data: TypedFastBitSet
  ): Map<string, Map<string, number[]>> {
    const locations = data.array();
    const result = new Map<string, Map<string, number[]>>();
    let p = 0;
    let q = 0;
    this.courses.forEach((course, i) => {
      this.terms.forEach((term, j) => {
        for (let k = 0; k < this.cardinalityTable[i][j]; k++, q++) {
          if (locations[p] == q) {
            p++;
            let termMap = result.get(course);
            if (!termMap) {
              result.set(course, (termMap = new Map<string, number[]>()));
            }
            let sections = termMap.get(term);
            if (!sections) {
              termMap.set(term, (sections = []));
            }
            sections.push(k);
          }
        }
      });
    });
    if (p == locations.length) {
      return result;
    } else {
      throw new Error("Unable to resolve all courses.");
    }
  }

  getBitSetForCourses(courses: string[]) {
    const result = new TypedFastBitSet();
    result.resize(this.getTotalCardinality());
    const indices = courses
      .map(course => this.courses.indexOf(course))
      .filter(index => index >= 0)
      .forEach(index => {
        const from = this.courseOffsets[index];
        const to = this.courseOffsets[index + 1];
        for (let i = from; i < to; i++) {
          result.add(i);
        }
      });
    return result;
  }

  getBitSetForTerms(terms: string[]) {
    const result = new TypedFastBitSet();
    result.resize(this.getTotalCardinality());
    let p = 0;
    this.courses.forEach((course, i) => {
      this.terms.forEach((term, j) => {
        const add = terms.includes(term);
        if (add) {
          for (let k = 0; k < this.cardinalityTable[i][j]; k++) {
            result.add(p++);
          }
        } else {
          p += this.cardinalityTable[i][j];
        }
      });
    });
    return result;
  }

  private unpackCourseIndex(data: string): TypedFastBitSet {
    const courses = new Set<number>(unpack(data));
    const result = new TypedFastBitSet();
    let index = 0;
    for (let i = 0; i < this.courses.length; i++) {
      const included = courses.has(i);
      for (let j = 0; j < this.terms.length; j++) {
        for (let k = 0; k < this.cardinalityTable[i][j]; k++, index++) {
          if (included) {
            result.add(index);
          }
        }
      }
    }
    return result;
  }

  private unpackTermIndex(data: string): TypedFastBitSet {
    const terms = new Set<number>(unpack(data));
    const result = new TypedFastBitSet();
    let index = 0;
    for (let i = 0; i < this.courses.length; i++) {
      for (let j = 0; j < this.terms.length; j++) {
        const included = terms.has(j);
        for (let k = 0; k < this.cardinalityTable[i][j]; k++, index++) {
          if (included) {
            result.add(index);
          }
        }
      }
    }
    return result;
  }

  private unpackSectionIndex(data: string): TypedFastBitSet {
    return new TypedFastBitSet(unpack(data));
  }

  getSequences(): string[] {
    return keysWithoutMetadata(this.sequences);
  }

  getSparseSequence(key: string): string[] {
    return Array.from(new Set<number>(unpack(this.sequences.get(key)))).map(
      i => this.courses[i]
    );
  }

  sequence(key: string): TypedFastBitSet {
    return getOrUnpack(this.sequences, x => this.unpackCourseIndex(x), key);
  }

  getDepartments(): string[] {
    return keysWithoutMetadata(this.departments);
  }

  department(key: string): TypedFastBitSet {
    return getOrUnpack(this.departments, x => this.unpackCourseIndex(x), key);
  }

  getInstructors(): string[] {
    return keysWithoutMetadata(this.instructors);
  }

  instructor(key: string): TypedFastBitSet {
    return getOrUnpack(this.instructors, x => this.unpackSectionIndex(x), key);
  }

  getPeriods(): string[] {
    return keysWithoutMetadata(this.periods);
  }

  period(key: string): TypedFastBitSet {
    return getOrUnpack(this.periods, x => this.unpackTermIndex(x), key);
  }

  getYears(): number[] {
    return keysWithoutMetadata(this.years).map(x => parseInt(x, 10));
  }

  year(key: number): TypedFastBitSet {
    return getOrUnpack(this.years, x => this.unpackTermIndex(x), `${key}`);
  }

  enrollment(key: string): TypedFastBitSet {
    return getOrUnpack(this.enrollments, x => this.unpackSectionIndex(x), key);
  }

  age(key: string): TypedFastBitSet {
    return getOrUnpack(this.ages, x => this.unpackCourseIndex(x), key);
  }
}
