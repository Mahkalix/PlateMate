import { createServer } from "node:http";
import { createHash, randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

// Stand-in for the tenant only. The application still exchanges real codes over HTTP,
// verifies the PKCE challenge and checks the signed ID token with the public JWKS.
export async function startIssuer(port = 0) {
  const keys = await generateKeyPair("RS256");
  const other = await generateKeyPair("RS256");
  const publicKey = {
    ...(await exportJWK(keys.publicKey)),
    kid: "test-key",
    alg: "RS256",
  };
  type User = { sub: string; email: string; email_verified: boolean };
  const grants = new Map<
    string,
    { user: User; params: URLSearchParams; fault?: string }
  >();
  const server = createServer(async (req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.url === "/.well-known/jwks.json") {
      res.end(JSON.stringify({ keys: [publicKey] }));
      return;
    }
    if (req.url !== "/oauth/token" || req.method !== "POST") {
      res.writeHead(404).end();
      return;
    }
    let body = "";
    for await (const chunk of req) body += chunk;
    const form = new URLSearchParams(body);
    const code = form.get("code") ?? "";
    const grant = grants.get(code);
    grants.delete(code);
    const challenge = createHash("sha256")
      .update(form.get("code_verifier") ?? "")
      .digest("base64url");
    if (
      !grant ||
      form.get("client_id") !== "test-web" ||
      form.get("client_secret") !== "test-client-secret" ||
      form.get("grant_type") !== "authorization_code" ||
      form.get("redirect_uri") !== grant.params.get("redirect_uri") ||
      challenge !== grant.params.get("code_challenge")
    ) {
      res.writeHead(400).end(JSON.stringify({ error: "invalid_grant" }));
      return;
    }
    const { fault, user, params } = grant;
    const idToken = await new SignJWT({
      ...user,
      nonce: fault === "nonce" ? "wrong" : params.get("nonce"),
    })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setIssuer(fault === "issuer" ? "https://wrong.invalid/" : issuer)
      .setAudience(fault === "audience" ? "other-api" : "test-web")
      .setIssuedAt()
      .setExpirationTime(fault === "expired" ? 1 : "5m")
      .sign(fault === "signature" ? other.privateKey : keys.privateKey);
    res.end(
      JSON.stringify({
        token_type: "Bearer",
        access_token: "provider-access",
        id_token: idToken,
      }),
    );
  });
  await new Promise<void>((resolve, reject) =>
    server.once("error", reject).listen(port, "127.0.0.1", resolve),
  );
  const issuer =
    "http://127.0.0.1:" + (server.address() as AddressInfo).port + "/";
  return {
    issuer,
    approve(
      authorizeUrl: string,
      email = "mika@example.org",
      overrides: Partial<User> = {},
      fault?: string,
    ) {
      const url = new URL(authorizeUrl);
      if (url.href.split("?")[0] !== issuer + "authorize")
        throw Error("Unexpected authorize URL");
      const code = randomUUID();
      const params = url.searchParams;
      grants.set(code, {
        user: {
          sub: "auth0|" + email,
          email,
          email_verified: true,
          ...overrides,
        },
        params,
        fault,
      });
      const callback = new URL(params.get("redirect_uri")!);
      callback.searchParams.set("state", params.get("state")!);
      callback.searchParams.set("code", code);
      return callback.pathname + callback.search;
    },
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      }),
  };
}
