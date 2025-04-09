require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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
        created_at BIGINT,
        verified BOOLEAN DEFAULT FALSE
      )
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'unique_email_phone_seat'
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
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'unique_email_phone_verify'
        ) THEN
          ALTER TABLE verifications
          ADD CONSTRAINT unique_email_phone_verify UNIQUE (email, phone);
        END IF;
      END
      $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        seat_code TEXT NOT NULL,
        email TEXT,
        timestamp BIGINT NOT NULL,
        detail JSONB
      )
    `);

    const rows = Array.from({ length: 12 }, (_, i) => String.fromCharCode(65 + i));
    const nums = Array.from({ length: 25 }, (_, i) => i);

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

async function clearDatabase() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM orders");
    await client.query("DELETE FROM logs");
    await client.query("UPDATE seats SET status = 'available', locked_at = NULL");
    await client.query("COMMIT");
    console.log("資料庫已清空並重設座位狀態");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("清除資料庫失敗", err);
    throw err;
  } finally {
    client.release();
  }
}

async function clearExpiredUnverifiedOrders(expireMinutes = 15) {
  const client = await pool.connect();
  const now = Date.now();
  const expireThreshold = now - expireMinutes * 60 * 1000;

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT email, seat_code, created_at FROM orders
       WHERE verified = false AND created_at < $1`,
      [expireThreshold]
    );

    const expiredOrders = result.rows;
    const seatCodes = expiredOrders.map(row => row.seat_code);

    if (expiredOrders.length > 0) {
      for (const order of expiredOrders) {
        await client.query(
          `INSERT INTO logs (action, seat_code, email, timestamp, detail)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            'auto_clear',
            order.seat_code,
            order.email,
            now,
            JSON.stringify({ reason: "expired unverified", created_at: order.created_at })
          ]
        );
      }

      await client.query(
        `UPDATE seats SET status = 'available', locked_at = NULL
         WHERE code = ANY($1)`,
        [seatCodes]
      );

      await client.query(
        `DELETE FROM orders WHERE verified = false AND created_at < $1`,
        [expireThreshold]
      );

      console.log(`🧹 清理 ${expiredOrders.length} 筆未驗證訂單，並已寫入 logs`);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ 清理未驗證訂單失敗：", err);
  } finally {
    client.release();
  }
}

initializeDatabase();

module.exports = {
  pool,
  initializeDatabase,
  clearDatabase,
  clearExpiredUnverifiedOrders
};
