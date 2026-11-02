import { SignJWT, jwtVerify, errors } from "jose";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthRepository } from "../repositories/auth.js";
const credentials = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z
      .string()
      .min(1)
      .refine((p) => Buffer.byteLength(p) <= 72),
  })
  .strict();
const registration = credentials.extend({
  password: z
    .string()
    .min(12)
    .refine((p) => Buffer.byteLength(p) <= 72),
});
const dummyHash = bcrypt.hashSync(randomBytes(32).toString("hex"), 12);
const fingerprint = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export class AuthError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
export class AuthService {
  private key: Uint8Array;
  constructor(
    private repo: AuthRepository,
    secret: string | undefined,
  ) {
    if (!secret || Buffer.byteLength(secret) < 32)
      throw new Error("JWT_SECRET doit contenir au moins 32 octets");
    this.key = new TextEncoder().encode(secret);
  }
  async register(body: unknown) {
    const { email, password } = registration.parse(body);
    const user = await this.repo.register(
      email,
      await bcrypt.hash(password, 12),
    );
    if (!user) throw new AuthError(409, "email_unavailable");
    return user;
  }
  async login(body: unknown) {
    const { email, password } = credentials.parse(body);
    const user = await this.repo.credentials(email);
    const valid = await bcrypt.compare(
      password,
      user?.password_hash ?? dummyHash,
    );
    if (!user || !valid) throw new AuthError(401, "invalid_credentials");
    const refresh = randomBytes(32).toString("base64url");
    const session = await this.repo.start(user.id, fingerprint(refresh));
    return this.tokens(session, refresh);
  }
  async refresh(old: string) {
    const refresh = randomBytes(32).toString("base64url");
    const session = await this.repo.rotate(
      fingerprint(old),
      fingerprint(refresh),
    );
    if (!session) throw new AuthError(401, "invalid_session");
    return this.tokens(session, refresh);
  }
  private async tokens(
    session: { id: string; user_id: string },
    refresh: string,
  ) {
    const accessToken = await new SignJWT({ sid: session.id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("platemate")
      .setAudience("matching")
      .setSubject(session.user_id)
      .setIssuedAt()
      .setExpirationTime("10m")
      .sign(this.key);
    return { refresh, accessToken };
  }
  async authenticate(header: string | undefined) {
    if (!header?.startsWith("Bearer "))
      throw new AuthError(401, "invalid_session");
    try {
      const { payload } = await jwtVerify(header.slice(7), this.key, {
        algorithms: ["HS256"],
        issuer: "platemate",
        audience: "matching",
        requiredClaims: ["exp", "sub", "sid"],
      });
      const sessionId = z.uuid().parse(payload.sid);
      const userId = z.uuid().parse(payload.sub);
      const user = await this.repo.identity(sessionId, userId);
      if (!user) throw new AuthError(401, "invalid_session");
      return { user, sessionId };
    } catch (err) {
      if (err instanceof errors.JOSEError || err instanceof z.ZodError)
        throw new AuthError(401, "invalid_session");
      throw err;
    }
  }
  logout(sessionId: string) {
    return this.repo.end(sessionId);
  }
}
