const express = require("express");
const router = express.Router();
const { initializeDatabase, clearDatabase, pool } = require("../database");// 根據你的檔案路徑調整

// POST /api/admin/clear
router.post("/clear", async (req, res) => {
  const { secret } = req.body;

  // 防止誤觸，可加上簡單密碼保護
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, error: "Unauthorized" });
  }

  try {
    await clearDatabase();
    res.json({ success: true, message: "資料已清空" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/dump", async (req, res) => {
  try {
    const client = await pool.connect();

    const orders = (await client.query("SELECT * FROM orders")).rows;
    const logs = (await client.query("SELECT * FROM logs")).rows;
    const seats = (await client.query("SELECT * FROM seats")).rows;

    client.release();

    res.json({ orders, logs, seats });
  } catch (err) {
    console.error("匯出資料失敗", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/initdb", async (req, res) => {
  try {
    await initializeDatabase(); // 注意這裡加了 await
    res.json({ success: true, message: "資料庫初始化完成" });
  } catch (err) {
    console.error("初始化資料庫失敗", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


module.exports = router;