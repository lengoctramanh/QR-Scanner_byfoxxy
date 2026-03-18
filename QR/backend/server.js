const express = require("express");
const cors = require("cors");
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require("./routes/adminRoutes");
const scanRoutes = require("./routes/scanRoutes");
require("dotenv").config();

const app = express();

// cấu hình xử lý trung gian
// kết nối cổng 5173 frontend với cổng 5000 backend
app.use(cors());
// server đọc dữ liệu từ json
app.use(express.json());

// Route
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/scan", scanRoutes);

// chạy server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend Server is running on: http://localhost:${PORT}`);
});
