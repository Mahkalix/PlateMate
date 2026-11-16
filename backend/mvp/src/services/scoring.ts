type Criteria = {
  languages?: string[];
  affinities?: string[];
  diets?: string[];
};
function fraction(wanted: string[] = [], offered: string[] = []) {
  return wanted.length
    ? wanted.filter((x) => offered.includes(x)).length / wanted.length
    : 0;
}
export function score(viewer: Criteria, candidate: Criteria) {
  return Math.round(
    40 * fraction(viewer.languages, candidate.languages) +
      40 * fraction(viewer.affinities, candidate.affinities) +
      20 * fraction(viewer.diets, candidate.diets),
  );
}
export function compatible(
  allergies: string[],
  intolerances: string[],
  safeFor: string[],
) {
  return [...allergies, ...intolerances].every((x) => safeFor.includes(x));
}
