import { expect, it } from "vitest";
import { testDatabase } from "../../src/config.js";
it("S0 / SANS ÉCRAN : refuse une base hors test", () => {
  expect(() => testDatabase("postgres://u:p@localhost/platemate")).toThrow();
});
