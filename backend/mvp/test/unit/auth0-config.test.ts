import { it, expect } from "vitest";
import { Auth0Login } from "../../src/services/auth0.js";
const env = {
  NODE_ENV: "production",
  AUTH0_ISSUER_BASE_URL: "https://tenant.example/",
  AUTH0_CLIENT_ID: "web",
  AUTH0_CLIENT_SECRET: "secret",
  AUTH0_CALLBACK_URL: "https://app.example/auth/callback",
  APP_ORIGIN: "https://app.example",
  JWT_SECRET: "only-for-testing-these-configurations",
};
it.each([
  { AUTH0_CLIENT_SECRET: "" },
  { AUTH0_ISSUER_BASE_URL: "http://127.0.0.1:1234/" },
  { AUTH0_ISSUER_BASE_URL: "https://tenant.example/other" },
  { AUTH0_CALLBACK_URL: "http://localhost:3001/auth/callback" },
  { AUTH0_CALLBACK_URL: "https://app.example/other" },
  { APP_ORIGIN: "https://app.example/redirect?next=other" },
  { APP_ORIGIN: "http://localhost:8080" },
])(
  "US01 / Connexion : configuration incomplète ou dangereuse refusée %o",
  (values) => {
    expect(() => new Auth0Login({ ...env, ...values })).toThrow();
  },
);
it("US01 / Connexion : domaine et connexion Database configurés côté serveur", async () => {
  const provider = new Auth0Login({
    ...env,
    AUTH0_CONNECTION: "Comptes-PlateMate",
  });
  const url = new URL((await provider.start(false)).url);
  expect(url.origin).toBe("https://tenant.example");
  expect(url.searchParams.get("connection")).toBe("Comptes-PlateMate");
});
