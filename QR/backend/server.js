const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const scanRoutes = require("./routes/scanRoutes");
const { startQrProcessingWorker } = require("./app/qrProcessingWorker");
const path = require("path");
require("dotenv").config();

const app = express();

// Ham nay dung de cau hinh middleware CORS cho backend.
// Nhan vao: khong nhan tham so, middleware duoc dang ky truc tiep vao app.
// Tac dong: cho phep frontend gui request cross-origin den backend.
app.use(cors());

// Ham nay dung de cho phep server doc body JSON tu request.
// Nhan vao: khong nhan tham so, middleware json cua Express.
// Tac dong: parse req.body thanh object JavaScript cho cac route.
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/scan", scanRoutes);
app.use("/pictures", express.static(path.join(__dirname, "pictures")));
app.use("/QRScan", express.static(path.join(__dirname, "app", "QRScan")));
app.use("/ProcessedQRScan", express.static(path.join(__dirname, "app", "ProcessedQRScan")));

const PORT = process.env.PORT || 5000;

// Ham nay dung de khoi dong HTTP server cua backend.
// Nhan vao: PORT la cong lang nghe va callback sau khi server start.
// Tac dong: mo server Express va ghi log dia chi truy cap ra console.
app.listen(PORT, () => {
  console.log(`Backend Server is running on: http://localhost:${PORT}`);
  startQrProcessingWorker();
});
