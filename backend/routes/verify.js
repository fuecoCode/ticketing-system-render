const path = require("path");
const express = require("express");
const router = express.Router();
const pool = require("../database");
const { sendVerificationCode } = require("../email");

// POST /verify/request
router.post("/request", async (req, res) => {
  const { email, phone } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 分鐘

  try {
    await pool.query(
      `INSERT INTO verifications (email, phone, code, expires_at) VALUES ($1, $2, $3, $4)`,
      [email, phone, code, expiresAt]
    );

    await sendVerificationCode(email, code);
    res.json({ success: true });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({
      error: err.message,
      detail: err.code === 'ECONNREFUSED' ? 'Database not connected' : 'Email failed or DB error',
    });
  }
});

// POST /verify/confirm
router.post("/confirm", async (req, res) => {
  const { email, phone, code } = req.body;
  const now = Date.now();

  try {
    const result = await pool.query(
      `SELECT * FROM verifications 
       WHERE email = $1 AND phone = $2 AND code = $3 AND expires_at > $4 
       ORDER BY expires_at DESC LIMIT 1`,
      [email, phone, code, now]
    );

    if (result.rows.length > 0) {
      // 驗證成功，刪除紀錄（可選）
      await pool.query(
        `DELETE FROM verifications WHERE email = $1 AND phone = $2`,
        [email, phone]
      );
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: "驗證失敗或已過期" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
