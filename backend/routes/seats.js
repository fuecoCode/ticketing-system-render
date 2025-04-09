const express = require('express');
const router = express.Router();
const seatMap = require('../data/seatMap');
const {pool} = require("../database");
const crypto = require("crypto");
const NodeCache = require("node-cache");
const bookingCache = new NodeCache({ stdTTL: 300 }); // 5 分鐘過期


// 清除過期鎖定
async function releaseExpiredLocks() {
  const now = Date.now();
  const expireLimit = now - 5 * 60 * 1000;

  await pool.query(`
    UPDATE seats
    SET status = 'available', locked_at = NULL
    WHERE status = 'locked' AND locked_at IS NOT NULL AND locked_at < $1
  `, [expireLimit]);
}

// GET /status
router.get("/status", async (req, res) => {
  try {
    await releaseExpiredLocks();

    const result = await pool.query("SELECT code, status FROM seats");
    const seatMap = {};
    result.rows.forEach(row => {
      seatMap[row.code] = { status: row.status };
    });
    res.json(seatMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /lock
router.post("/lock", async (req, res) => {
  const { seats } = req.body;
  const now = Date.now();

  if (!Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ success: false, error: "No seats selected." });
  }

  try {
    await releaseExpiredLocks();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const locked = [];

      for (const code of seats) {
        const result = await client.query(`
          UPDATE seats
          SET status = 'locked', locked_at = $1
          WHERE code = $2 AND status = 'available'
          RETURNING code
        `, [now, code]);

        if (result.rowCount === 1) {
          locked.push(code);
        }
      }

      if (locked.length !== seats.length) {
        await client.query("ROLLBACK");
        return res.status(409).json({ success: false, error: "Some seats are no longer available", locked });
      }

      await client.query("COMMIT");

      // 產生 bookingToken 並暫存
      const bookingToken = crypto.randomUUID();
      bookingCache.set(bookingToken, seats);

      res.json({ success: true, bookingToken, lockedSeats: seats });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /release
router.post("/release", async (req, res) => {
  const { seats } = req.body;
  if (!Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ success: false, error: "Missing seat list" });
  }
  try {
    await releaseExpiredLocks();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const code of seats) {
        await client.query(`
          UPDATE seats
          SET status = 'available', locked_at = NULL
          WHERE code = $1 AND status = 'locked'
        `, [code]);
      }

      await client.query("COMMIT");
      res.json({ success: true, released: seats });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
