const path = require("path");
const express = require("express");
const router = express.Router();
const pool = require("../database");
const { sendBookingConfirmation } = require("../email");

// POST /orders/create
router.post("/create", async (req, res) => {
  const { name, nickname, phone, email, seats } = req.body;
  const now = Date.now();

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const code of seats) {
        await client.query(
          `INSERT INTO orders (name, nickname, phone, email, seat_code, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [name, nickname, phone, email, code, now]
        );

        await client.query(
          `UPDATE seats SET status = 'booked', locked_at = NULL WHERE code = $1`,
          [code]
        );
      }

      await client.query("COMMIT");
      await sendBookingConfirmation(email, name, seats);
      res.json({ success: true });
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


module.exports = router;
