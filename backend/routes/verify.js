const path = require("path");
const express = require("express");
const router = express.Router();
const db = require("../database");
const { sendVerificationCode } = require("../email");

router.post("/request", (req, res) => {
  const { email, phone } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 分鐘

  db.run(
    `INSERT INTO verifications (email, phone, code, expires_at) VALUES (?, ?, ?, ?)`,
    [email, phone, code, expiresAt],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });

      sendVerificationCode(email, code)
        .then(() => res.json({ success: true }))
        .catch(err => res.status(500).json({ error: "Email failed", detail: err.message }));
    }
  );
});

router.post("/confirm", (req, res) => {
  const { email, phone, code } = req.body;
  const now = Date.now();

  db.get(
    `SELECT * FROM verifications 
     WHERE email = ? AND phone = ? AND code = ? AND expires_at > ? 
     ORDER BY expires_at DESC LIMIT 1`,
    [email, phone, code, now],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      if (row) {
        // 驗證成功，刪除驗證紀錄（可選）
        db.run(
          `DELETE FROM verifications WHERE email = ? AND phone = ?`,
          [email, phone]
        );
        res.json({ success: true });
      } else {
        res.status(400).json({ success: false, message: "驗證失敗或已過期" });
      }
    }
  );
});

module.exports = router;
