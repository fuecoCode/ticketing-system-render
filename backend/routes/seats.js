// backend/routes/seats.js
const path = require("path");
const express = require('express');
const router = express.Router();
const seatMap = require('../data/seatMap');
const db = require("../database");

function releaseExpiredLocks(db) {
  const now = Date.now();
  const expireLimit = now - 5 * 60 * 1000;

  db.run(`
    UPDATE seats
    SET status = 'available', locked_at = NULL
    WHERE status = 'locked' AND locked_at IS NOT NULL AND locked_at < ?
  `, [expireLimit]);
}

router.get("/status", (req, res) => {
  
  releaseExpiredLocks(db); // 加在 router handler 裡最前面
  db.all("SELECT code, status FROM seats", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const seatMap = {};
    rows.forEach(row => {
      seatMap[row.code] = { status: row.status };
    });
    res.json(seatMap);
  });
});

router.post("/lock", (req, res) => {
  
  releaseExpiredLocks(db); // 加在 router handler 裡最前面
  const { seats } = req.body;
  const now = Date.now();

  const stmt = db.prepare("UPDATE seats SET status = 'locked', locked_at = ? WHERE code = ? AND status = 'available'");
  seats.forEach(code => {
    stmt.run(now, code);
  });
  stmt.finalize(() => {
    res.json({ success: true, lockedSeats: seats });
  });
});

router.post("/release", (req, res) => {
  
  releaseExpiredLocks(db); // 加在 router handler 裡最前面
  const { seats } = req.body;

  const stmt = db.prepare("UPDATE seats SET status = 'available', locked_at = NULL WHERE code = ? AND status = 'locked'");
  seats.forEach(code => {
    stmt.run(code);
  });
  stmt.finalize(() => {
    res.json({ success: true, released: seats });
  });
});

module.exports = router;
