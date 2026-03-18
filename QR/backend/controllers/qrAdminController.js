// backend/controllers/qrAdminController.js
const qrImageBuilder = require("../app/generator/qrImageBuilder");

const qrAdminController = {
  // API dùng để Admin test việc tạo mã QR 1 (Mã bề mặt)
  generateTestQrImage: async (req, res) => {
    try {
      // Admin sẽ gửi url xuống qua req.body
      const { customUrl } = req.body;

      if (!customUrl) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp URL cần tạo mã QR!",
        });
      }

      // Gọi Lõi thuật toán để vẽ ảnh
      const base64Image = await qrImageBuilder.generateBase64(customUrl);

      // Trả hình ảnh về cho Frontend
      return res.status(200).json({
        success: true,
        message: "Tạo ảnh QR thành công",
        qrImageData: base64Image, // Chuỗi này dài loằng ngoằng bắt đầu bằng "data:image/png;base64,..."
      });
    } catch (error) {
      console.error("Controller Error:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi Server khi tạo ảnh QR",
      });
    }
  },
};

module.exports = qrAdminController;
