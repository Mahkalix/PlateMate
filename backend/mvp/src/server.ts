import { app } from "./app.js";
import { pool } from "./pool.js";
import { settleNext } from "./repositories/settlements.js";
if (process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
  const tick = async () => {
    try {
      await settleNext(pool);
    } catch {
      console.error("stripe_settlement_retry");
    } finally {
      setTimeout(tick, 5000).unref();
    }
  };
  void tick();
}
app.listen(Number(process.env.PORT ?? 3001));
