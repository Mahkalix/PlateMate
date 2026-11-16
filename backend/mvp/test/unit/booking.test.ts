import { it, expect } from "vitest";
import { allows } from "../../src/services/booking.js";
const statuses = [
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "completed",
] as const;
const valid = new Set([
  "pending:accepted",
  "pending:declined",
  "pending:cancelled",
  "accepted:cancelled",
  "accepted:completed",
]);
for (const from of statuses)
  for (const to of statuses)
    it("US16 / Réservations : " + from + " vers " + to, () => {
      expect(allows(from, to)).toBe(valid.has(from + ":" + to));
    });
