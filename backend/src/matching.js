export function compatibility(viewer, candidate) {
  let points = 0;
  const sharedLanguages = viewer.languages.filter(language => candidate.languages.includes(language));
  if (sharedLanguages.length) points += 50;
  if (viewer.city.toLocaleLowerCase('fr') === candidate.city.toLocaleLowerCase('fr')) points += 30;
  const sharedPreferences = viewer.dietaryPreferences.filter(item => candidate.dietaryPreferences.includes(item));
  if (sharedPreferences.length) points += 20;
  return { score: points, sharedLanguages, sharedPreferences };
}
