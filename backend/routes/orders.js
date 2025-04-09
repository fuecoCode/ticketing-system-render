const path = require("path");
const express = require("express");
const router = express.Router();
const {pool} = require("../database");
const { sendBookingConfirmation, sendCancellationConfirmation } = require("../email");

// ✅ 加入這行：從 seats 匯入 bookingCache
const { bookingCache } = require("./seats");

// POST /orders/create
router.post("/create", async (req, res) => {
  const { name, nickname, phone, email, seats, bookingToken  } = req.body;
  const now = Date.now();

  // ✅ bookingToken 驗證
  const validSeats = bookingCache.get(bookingToken);
  if (
    !validSeats ||
    JSON.stringify(validSeats.sort()) !== JSON.stringify(seats.sort())
  ) {
    return res.status(403).json({ success: false, error: "Invalid or expired booking token." });
  }
  bookingCache.del(bookingToken); // 一次性使用

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const code of seats) {
        // 檢查是否已存在相同 email + phone + seat_code 的紀錄
        const existing = await client.query(
          `SELECT 1 FROM orders WHERE email = $1 AND phone = $2 AND seat_code = $3 LIMIT 1`,
          [email, phone, code]
        );

        if (existing.rows.length > 0) {
          throw new Error(`Seat ${code} already booked by this user.`);
        }
        await client.query(
          `INSERT INTO orders (name, nickname, phone, email, seat_code, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [name, nickname, phone, email, code, now]
        );

        await client.query(
          `UPDATE seats SET status = 'booked', locked_at = NULL WHERE code = $1`,
          [code]
        );
        // 3. 紀錄 log（功能 2）
        await client.query(
          `INSERT INTO logs (action, seat_code, email, timestamp, detail)
           VALUES ($1, $2, $3, $4, $5)`,
          ['reserve', code, email, now, JSON.stringify({ name, nickname, phone })]
        );
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 分鐘

      await client.query(
        `INSERT INTO verifications (email, phone, code, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [email, phone, code, expiresAt]
      );

      // 更新 sendBookingConfirmation 加驗證碼
      await sendBookingConfirmation(email, name, seats, code);

      await client.query("COMMIT");

      res.json({ success: true });
    } catch (err) {
      await client.query("ROLLBACK");
      if (err.code === "23505") {
        return res.status(409).json({ success: false, error: "Duplicate booking detected." });
      }
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /orders/lookup
router.post("/lookup", async (req, res) => {
  const { email, phone } = req.body;

  try {
    const result = await pool.query(
      `SELECT * FROM orders WHERE email = $1 AND phone = $2 ORDER BY created_at DESC`,
      [email, phone]
    );

    res.json({ success: true, orders: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /orders/cancel
router.post("/cancel", async (req, res) => {
  const { email, phone, seats } = req.body;

  if (!email || !phone || !seats || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ success: false, error: "Missing or invalid parameters" });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let deletedCount = 0;
      const now = Date.now(); // 🔥 加入 timestamp

      for (const code of seats) {
        const deleteResult = await client.query(
          `DELETE FROM orders WHERE email = $1 AND phone = $2 AND seat_code = $3`,
          [email, phone, code]
        );

        if (deleteResult.rowCount > 0) {
          deletedCount++;

          await client.query(
            `UPDATE seats SET status = 'available', locked_at = NULL WHERE code = $1`,
            [code]
          );
           // 🔥 紀錄 log
          await client.query(
            `INSERT INTO logs (action, seat_code, email, timestamp, detail)
             VALUES ($1, $2, $3, $4, $5)`,
            ['cancel', code, email, now, JSON.stringify({ phone })]
          );
        }
      }

      if (deletedCount === 0) {
        await client.query("ROLLBACK");
        return res.json({ success: false, error: "No matching orders found" });
      }

      await client.query("COMMIT");

      // 查詢使用者名字以便寄信
      const userResult = await client.query(
        `SELECT name FROM orders WHERE email = $1 AND phone = $2 LIMIT 1`,
        [email, phone]
      );
      const userName = userResult.rows[0]?.name || "顧客";

      // 寄出取消通知信
      await sendCancellationConfirmation(email, userName, seats);

      res.json({ success: true, cancelled: deletedCount });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/report/orders", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/report/logs", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM logs ORDER BY timestamp DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});



module.exports = router;
