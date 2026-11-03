import { it, expect } from "vitest";
import { testDatabase } from "../../src/config.js";
it("S0 / SANS ÉCRAN : accepte la base dédiée", () => {
  const url = "postgres://test@localhost/platemate_test";
  expect(testDatabase(url)).toBe(url);
});
it("S0 / SANS ÉCRAN : refuse un schéma de connexion non PostgreSQL", () => {
  expect(() => testDatabase("https://localhost/platemate_test")).toThrow();
});
