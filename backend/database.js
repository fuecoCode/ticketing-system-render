require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // for Render's hosted PG
  }
});
  // user: process.env.DB_USER,
  // host: process.env.DB_HOST,
  // database: process.env.DB_NAME,
  // password: process.env.DB_PASSWORD,
  // port: process.env.DB_PORT,
// });


async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS seats (
        code TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        locked_at BIGINT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        name TEXT,
        nickname TEXT,
        phone TEXT,
        email TEXT,
        seat_code TEXT REFERENCES seats(code),
        created_at BIGINT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS verifications (
        email TEXT,
        phone TEXT,
        code TEXT,
        expires_at BIGINT
      )
    `);

    const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    const leftNumbers = [24, 22, 20, 18, 16, 14];
    const midNumbers = [12, 10, 8, 6, 4, 2, 1, 3, 5, 7, 9, 11];
    const rightNumbers = [13, 15, 17, 19, 21, 23];

    for (let row of rows) {
      for (let num of [...leftNumbers, ...midNumbers, ...rightNumbers]) {
        const code = `${row}${num}`;
        await client.query(
          `INSERT INTO seats (code, status, locked_at)
           VALUES ($1, 'available', NULL)
           ON CONFLICT (code) DO NOTHING`,
          [code]
        );
      }
    }

    await client.query("COMMIT");
    console.log("Database initialized.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database initialization failed:", error);
  } finally {
    client.release();
  }
}

// 初始化資料庫
initializeDatabase();

module.exports = pool;
