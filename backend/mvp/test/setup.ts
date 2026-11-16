import { beforeEach, afterAll } from "vitest";
import { pool } from "../src/pool.js";
beforeEach(async () => {
  await pool.query("TRUNCATE users CASCADE");
});
afterAll(() => pool.end());
