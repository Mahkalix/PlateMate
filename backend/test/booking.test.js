import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { quote, bookingInput, dateInput } from '../src/booking-validation.js';

test('le serveur calcule le prix pour chaque invité', () => {
  assert.deepEqual(quote(2800, 400, 2), { menuSubtotalCents: 5600, serviceFeeCents: 800, totalCents: 6400, currency: 'eur' });
});
test('une demande ne peut pas fournir son propre prix et une date nécessite un fuseau', () => {
  assert.equal(bookingInput.safeParse({ dateId: '00000000-0000-4000-8000-000000000000', guests: 1, totalCents: 1 }).success, false);
  assert.equal(dateInput.safeParse({ startsAt: '2026-12-01T19:00:00', capacity: 2 }).success, false);
});
