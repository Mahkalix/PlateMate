import pg from "pg";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL obligatoire");
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  options: "-c search_path=platemate_mvp",
  connectionTimeoutMillis: 3000,
});
