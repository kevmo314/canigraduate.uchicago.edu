'use strict';

const GPA_MAP = {
  'A+': 4.0,
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  'C-': 1.7,
  'D+': 1.3,
  D: 1.0,
  F: 0.0,
};

module.exports = class {
  constructor(grade) {
    this.grade = grade;
  }
  get gpa() {
    return GPA_MAP[
      this.grade.startsWith('I') ? this.grade.substring(1) : this.grade
    ];
  }
  get quality() {
    return this.gpa !== undefined;
  }
  get credit() {
    return this.grade.endsWith('P') || (this.quality && this.gpa > 0);
  }
};
