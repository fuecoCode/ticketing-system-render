// backend/server.js
const express = require('express');
const cors = require('cors');
const seatRoutes = require('./routes/seats.js');
const orderRoutes = require('./routes/orders.js');
const verifyRoutes = require('./routes/verify');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/seats', seatRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/verify', verifyRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
