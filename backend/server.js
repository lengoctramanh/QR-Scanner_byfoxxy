const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/db');

const app = express();

app.use(cors()); 
app.use(express.json()); 

const authRoutes  = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Chào mừng đến với Backend của Real QR Scanner!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(` Backend Server đang chạy tại: http://localhost:${PORT}`);
});