import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { credentials, profile } from '../src/validation.js';

test('normalise les emails et refuse les mots de passe courts', () => {
  assert.equal(credentials.parse({ email: ' TEST@Example.COM ', password: 'a-long-password' }).email, 'test@example.com');
  assert.equal(credentials.safeParse({ email: 'test@example.com', password: 'short' }).success, false);
});

test('limite les données de profil et exige une ville et un nom', () => {
  assert.equal(profile.safeParse({ displayName: 'Max', city: 'Grenoble', allergies: ['arachides'] }).success, true);
  assert.equal(profile.safeParse({ displayName: '', city: 'Grenoble' }).success, false);
  assert.equal(profile.safeParse({ displayName: 'Max', city: 'Grenoble', isAdmin: true }).success, false);
});
