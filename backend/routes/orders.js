// routes/orders.js
const express = require("express");
const router = express.Router();
const db = require("../database");

router.post("/create", (req, res) => {
  const { name, nickname, phone, email, seats } = req.body;
  const now = Date.now();

  const insertStmt = db.prepare(`
    INSERT INTO orders (name, nickname, phone, email, seat_code, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const updateStmt = db.prepare(`
    UPDATE seats SET status = 'booked', locked_at = NULL WHERE code = ?
  `);

  seats.forEach(code => {
    insertStmt.run(name, nickname, phone, email, code, now);
    updateStmt.run(code);
  });

  insertStmt.finalize();
  updateStmt.finalize(() => {
    res.json({ success: true });
  });
});

router.post("/lookup", (req, res) => {
  const { email, phone } = req.body;

  db.all(
    `SELECT * FROM orders WHERE email = ? AND phone = ? ORDER BY created_at DESC`,
    [email, phone],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, orders: rows });
    }
  );
});

router.post("/cancel", (req, res) => {
  const { email, phone, seat_code } = req.body;
  
  db.serialize(() => {
    db.run(
      `DELETE FROM orders WHERE email = ? AND phone = ? AND seat_code = ?`,
      [email, phone, seat_code],
      function (err) {
        if (err) return res.json({ success: false, error: err.message });

        if (this.changes === 0) {
          return res.json({ success: false, error: "No matching order found" });
        }

        db.run(
          `UPDATE seats SET status = 'available', locked_at = NULL WHERE code = ?`,
          [seat_code],
          function (err2) {
            if (err2) return res.json({ success: false, error: err2.message });
            res.json({ success: true });
          }
        );
      }
    );
  });
});



module.exports = router;