import Stripe from "stripe";
import { AuthError } from "./services/auth.js";
export function testStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_test_"))
    throw new AuthError(503, "stripe_test_unavailable");
  return new Stripe(key, { timeout: 10000, maxNetworkRetries: 1 });
}
