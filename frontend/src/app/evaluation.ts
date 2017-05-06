export type Evaluation = {
  href: string,
  term: string,
  section: string,
  // UChicago lists instructors independently on their evaluations page,
  // so this may not necessarily match with section data. This may not
  // apply for other institutions.
  instructor: string,
};
