import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { compatibility } from '../src/matching.js';

test('classe les profils sur des critères explicables', () => {
  const viewer = { city: 'Grenoble', languages: ['fr'], dietaryPreferences: ['végétarien'] };
  assert.equal(compatibility(viewer, { city: 'grenoble', languages: ['fr'], dietaryPreferences: ['végétarien'] }).score, 100);
  assert.equal(compatibility(viewer, { city: 'Lyon', languages: ['en'], dietaryPreferences: [] }).score, 0);
});
