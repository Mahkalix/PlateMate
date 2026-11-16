import { it, expect } from "vitest";
import { profileInput } from "../../src/services/profile.js";
import { profile } from "../profile-fixture.js";
it.each([
  { firstName: "" },
  { languages: [] },
  { city: 12 },
  { description: "a".repeat(1001) },
  { consent: false },
  { is_verified: true },
  { publicInterests: ["privé"] },
])("US03 / Profil : refuse %j", (patch) => {
  expect(profileInput.safeParse({ ...profile, ...patch }).success).toBe(false);
});
it("US05 / Profil : autorise un profil sans collecte sensible", () => {
  expect(
    profileInput.parse({ ...profile, diets: [], allergies: [], consent: false })
      .consent,
  ).toBe(false);
});
