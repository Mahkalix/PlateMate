import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { experienceFilters } from '../src/experience-search.js';
import { photoUrl } from '../src/validation.js';

test('les régimes multiples et la taille du groupe sont acceptés', () => {
  const filters = experienceFilters.parse({ diet: ' Vegan ,sans-gluten', guests: '3', date: '2030-12-01' });
  assert.deepEqual(filters.diet, ['vegan', 'sans-gluten']);
  assert.equal(filters.guests, 3);
  assert.deepEqual(experienceFilters.parse({ diet: ['vegan', 'sans-gluten'] }).diet, filters.diet);
});

test('des filtres inconnus ou invalides ne sont pas silencieusement ignorés', () => {
  for (const query of [{ guests: '0' }, { guests: '1.5' }, { date: '2030-02-30' }, { diet: '' }, { score: '80' }, { sort: 'random' }]) {
    assert.equal(experienceFilters.safeParse(query).success, false);
  }
});

test('la photo est optionnelle et nécessite une URL HTTPS', () => {
  assert.equal(photoUrl.parse(undefined), null);
  assert.equal(photoUrl.safeParse('https://example.com/photo.jpg').success, true);
  assert.equal(photoUrl.safeParse('javascript:alert(1)').success, false);
});
