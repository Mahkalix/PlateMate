import { it, expect } from "vitest";
import { score, compatible } from "../../src/services/scoring.js";
const viewer = {
  languages: ["fr", "en"],
  affinities: ["jazz", "cinéma"],
  diets: ["vegan"],
};
it.each([
  [["fr", "en"], ["jazz", "cinéma"], ["vegan"], 100],
  [["fr"], ["jazz"], ["vegan"], 60],
  [["fr", "en"], [], [], 40],
  [[], ["jazz", "cinéma"], [], 40],
  [[], [], [], 0],
] as const)("US06 / Explorer : exemple %j %j %j = %i", (l, a, d, n) => {
  const host = { languages: [...l], affinities: [...a], diets: [...d] };
  expect(score(viewer, host)).toBe(n);
  expect(score(viewer, host)).toBe(score(viewer, host));
});
it("US06 / Explorer : profil incomplet", () => {
  expect(score({}, {})).toBe(0);
});
it("US06 / Explorer : un score maximal ne neutralise jamais une incompatibilité", () => {
  expect(score(viewer, viewer)).toBe(100);
  expect(compatible(["arachide"], [], [])).toBe(false);
  expect(compatible([], ["lactose"], [])).toBe(false);
  expect(compatible(["arachide"], ["lactose"], ["arachide", "lactose"])).toBe(
    true,
  );
});
