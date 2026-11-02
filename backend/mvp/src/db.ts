import { pool } from "./pool.js";
import { migrate } from "./migrations.js";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
try {
  await migrate(pool);
  if (process.argv[2] === "seed") {
    await pool.query(
      "INSERT INTO users(email,password_hash) VALUES($1,$2) ON CONFLICT(email) DO NOTHING",
      [
        "demo@example.invalid",
        await bcrypt.hash(randomBytes(32).toString("hex"), 12),
      ],
    );
  }
} finally {
  await pool.end();
}
