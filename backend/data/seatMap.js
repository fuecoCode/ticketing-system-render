// backend/data/seatMap.js
const seatMap = {};

for (let row = 0; row < 5; row++) {
  for (let col = 1; col <= 8; col++) {
    const code = `${String.fromCharCode(65 + row)}${col}`;
    seatMap[code] = { status: 'available', lockedAt: null };
  }
}

module.exports = seatMap;
