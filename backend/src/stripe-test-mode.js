export function assertStripeTestKey(key) {
  if (key && !key.startsWith('sk_test_')) throw new Error('PlateMate accepte uniquement une clé Stripe sk_test_ dans cette version');
}
