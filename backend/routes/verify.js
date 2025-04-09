const express = require("express");
const router = express.Router();
const { pool } = require("../database");
const { sendVerificationCode } = require("../email");

// POST /verify/request
router.post("/request", async (req, res) => {
  const { email, phone } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  try {
    await pool.query(
      `INSERT INTO verifications (email, phone, code, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email, phone)
       DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at`,
      [email, phone, code, expiresAt]
    );

    await sendVerificationCode(email, code);
    res.json({ success: true });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ success: false, error: err.message });
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
      await pool.query(
        `DELETE FROM verifications WHERE email = $1 AND phone = $2 AND code = $3`,
        [email, phone, code]
      );

      await pool.query(
        `UPDATE orders SET verified = true WHERE email = $1 AND phone = $2`,
        [email, phone]
      );

      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: "驗證失敗或已過期" });
    }
  } catch (err) {
    console.error("Confirm verification error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /verify/resend
router.post("/resend", async (req, res) => {
  const { email, phone } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  try {
    await pool.query(
      `INSERT INTO verifications (email, phone, code, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email, phone)
       DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at`,
      [email, phone, code, expiresAt]
    );

    await sendVerificationCode(email, code);
    res.json({ success: true, message: "驗證碼已重新寄出" });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
