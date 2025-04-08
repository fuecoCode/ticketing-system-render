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

    // ✅ 新增 unique constraint（email + phone + seat_code）
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'unique_email_phone_seat'
        ) THEN
          ALTER TABLE orders
          ADD CONSTRAINT unique_email_phone_seat UNIQUE (email, phone, seat_code);
        END IF;
      END
      $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS verifications (
        email TEXT,
        phone TEXT,
        code TEXT,
        expires_at BIGINT
      )
    `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS logs (
      id SERIAL PRIMARY KEY,
      action TEXT NOT NULL,           -- reserve / cancel
      seat_code TEXT NOT NULL,
      email TEXT,
      timestamp BIGINT NOT NULL,
      detail JSONB                    -- optional 詳細資訊
    )
  `);

    const rows = Array.from({ length: 12 }, (_, i) => String.fromCharCode(65 + i)); // A~L
    const nums = Array.from({ length: 25 }, (_, i) => i); // 0~24

    for (let row of rows) {
      for (let num of nums) {
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
