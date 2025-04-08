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
  const { email, phone, seat_code } = req.body;

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const deleteResult = await client.query(
        `DELETE FROM orders WHERE email = $1 AND phone = $2 AND seat_code = $3`,
        [email, phone, seat_code]
      );

      if (deleteResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.json({ success: false, error: "No matching order found" });
      }

      await client.query(
        `UPDATE seats SET status = 'available', locked_at = NULL WHERE code = $1`,
        [seat_code]
      );

      await client.query("COMMIT");
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

// test orders email
router.post("/test-email", async (req, res) => {
  const { email, name, seats } = req.body;

  if (!email || !name || !seats || !Array.isArray(seats)) {
    return res.status(400).json({ success: false, error: "Missing or invalid parameters" });
  }

  try {
    await sendBookingConfirmation(email, name, seats);
    res.json({ success: true, message: "Test email sent." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
