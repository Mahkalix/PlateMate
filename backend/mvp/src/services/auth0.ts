import * as oidc from "openid-client";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { AuthError } from "./auth.js";

const attemptSchema = z.object({
  state: z.string(),
  nonce: z.string(),
  verifier: z.string(),
});
const identitySchema = z.object({
  sub: z
    .string()
    .regex(/^auth0\|.+$/)
    .max(255),
  email: z.string().trim().toLowerCase().email().max(254),
  email_verified: z.literal(true),
});

export class Auth0Login {
  private client: oidc.Configuration;
  private issuer: string;
  private callback: URL;
  readonly appOrigin: string;
  private key: Uint8Array;
  private connection: string;

  constructor(env: NodeJS.ProcessEnv) {
    if (
      !env.AUTH0_ISSUER_BASE_URL ||
      !env.AUTH0_CLIENT_ID ||
      !env.AUTH0_CLIENT_SECRET ||
      !env.AUTH0_CALLBACK_URL ||
      !env.JWT_SECRET
    )
      throw new Error("Configuration Auth0 ou JWT_SECRET manquante");
    const issuer = new URL(env.AUTH0_ISSUER_BASE_URL);
    this.callback = new URL(env.AUTH0_CALLBACK_URL);
    const testIssuer =
      env.NODE_ENV === "test" &&
      issuer.protocol === "http:" &&
      issuer.hostname === "127.0.0.1";
    if (
      (!testIssuer && issuer.protocol !== "https:") ||
      issuer.pathname !== "/" ||
      issuer.search ||
      issuer.hash ||
      issuer.username ||
      issuer.password
    )
      throw new Error("Origine HTTPS Auth0 invalide");
    const localCallback =
      env.NODE_ENV !== "production" &&
      this.callback.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(this.callback.hostname);
    if (
      (!localCallback && this.callback.protocol !== "https:") ||
      this.callback.pathname !== "/auth/callback" ||
      this.callback.search ||
      this.callback.hash ||
      this.callback.username ||
      this.callback.password
    )
      throw new Error("AUTH0_CALLBACK_URL invalide");
    const origin = new URL(env.APP_ORIGIN ?? "");
    const localApp =
      env.NODE_ENV !== "production" &&
      origin.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(origin.hostname);
    if (
      (!localApp && origin.protocol !== "https:") ||
      origin.href !== origin.origin + "/"
    )
      throw new Error("APP_ORIGIN invalide");
    this.appOrigin = origin.origin;
    this.issuer = issuer.href;
    this.connection =
      env.AUTH0_CONNECTION || "Username-Password-Authentication";
    this.key = new TextEncoder().encode(env.JWT_SECRET);
    this.client = new oidc.Configuration(
      {
        issuer: this.issuer,
        authorization_endpoint: new URL("authorize", issuer).href,
        token_endpoint: new URL("oauth/token", issuer).href,
        jwks_uri: new URL(".well-known/jwks.json", issuer).href,
      },
      env.AUTH0_CLIENT_ID,
      { id_token_signed_response_alg: "RS256" },
      oidc.ClientSecretPost(env.AUTH0_CLIENT_SECRET),
    );
    this.client.timeout = 8;
    if (testIssuer) oidc.allowInsecureRequests(this.client);
    oidc.enableNonRepudiationChecks(this.client);
  }

  async start(signup: boolean) {
    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const verifier = oidc.randomPKCECodeVerifier();
    const url = oidc.buildAuthorizationUrl(this.client, {
      response_type: "code",
      scope: "openid email",
      redirect_uri: this.callback.href,
      connection: this.connection,
      prompt: "login",
      state,
      nonce,
      code_challenge_method: "S256",
      code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
      ...(signup ? { screen_hint: "signup" } : {}),
    });
    const attempt = await new SignJWT({ state, nonce, verifier })
      .setProtectedHeader({ alg: "HS256" })
      .setAudience("platemate-oidc-callback")
      .setExpirationTime("5m")
      .sign(this.key);
    return { url: url.href, attempt };
  }

  async finish(originalUrl: string, cookie: string) {
    const url = new URL(this.callback);
    url.search = new URL(originalUrl, this.callback.origin).search;
    try {
      const { payload } = await jwtVerify(cookie, this.key, {
        audience: "platemate-oidc-callback",
        algorithms: ["HS256"],
        requiredClaims: ["exp"],
      });
      const { state, nonce, verifier } = attemptSchema.parse(payload);
      const result = await oidc.authorizationCodeGrant(this.client, url, {
        expectedState: state,
        expectedNonce: nonce,
        pkceCodeVerifier: verifier,
      });
      const identity = identitySchema.parse(result.claims());
      return {
        issuer: this.issuer,
        subject: identity.sub,
        email: identity.email,
      };
    } catch (error) {
      if (
        error instanceof TypeError ||
        (error instanceof Error && error.name === "TimeoutError") ||
        (error instanceof oidc.ResponseBodyError && error.status >= 500)
      )
        throw new AuthError(503, "identity_provider_unavailable");
      throw new AuthError(401, "invalid_login");
    }
  }
}
