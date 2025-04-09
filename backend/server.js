// backend/server.js
const express = require('express');
const cors = require('cors');
const seatRoutes = require('./routes/seats.js');
const orderRoutes = require('./routes/orders.js');
const verifyRoutes = require('./routes/verify');
const adminRoutes = require('./routes/admin');
const { getAppVersion } = require('./version');
const cron = require("node-cron");
const { clearExpiredUnverifiedOrders } = require("./database");

const path = require("path");
const app = express();

const PORT = 3001;
const distPath = path.resolve(__dirname, "../frontend/dist");
app.use(cors());
// app.use(express.json());
app.use(express.json({ type: ['application/json', 'text/plain'] }));
app.use('/api/seats', seatRoutes.router);
app.use('/api/orders', orderRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/admin', adminRoutes);

// 執行排程：每 5 分鐘清理未驗證訂單
cron.schedule("*/5 * * * *", () => {
  console.log("⏰ [CRON] 執行自動清理未驗證訂單");
  clearExpiredUnverifiedOrders();
});

app.get('/api/version', (req, res) => {
  res.json({ version: getAppVersion() });
});

console.log("🧪 靜態檔案：", distPath);
app.use(express.static(distPath));

// ✅ 避免 path-to-regexp bug：用普通 function，不用箭頭函數
app.get("/*", function (req, res) {
  res.sendFile(path.join(distPath, "index.html"));
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} Version: ${getAppVersion()}`);
});
