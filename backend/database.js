// backend/database.js
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("concert.db");

// 初次啟動建表
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS seats (
      code TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      locked_at INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      nickname TEXT,
      phone TEXT,
      email TEXT,
      seat_code TEXT,
      created_at INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS verifications (
      email TEXT,
      phone TEXT,
      code TEXT,
      expires_at INTEGER
    )
  `);

  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
  const leftNumbers = [24, 22, 20, 18, 16, 14];
  const midNumbers = [12, 10, 8, 6, 4, 2, 1, 3, 5, 7, 9, 11]
  const rightNumbers = [13, 15, 17, 19, 21, 23];

  const stmt = db.prepare("INSERT OR IGNORE INTO seats (code, status, locked_at) VALUES (?, 'available', NULL)");

  for (let row of rows) {
    for (let num of [...leftNumbers, ...midNumbers, ...rightNumbers]) {
      const code = `${row}${num}`;
      // console.log(`Inserted seat: ${code}`);
      stmt.run(code);
    }
  }
  stmt.finalize();
});

module.exports = db;
