// backend/controllers/qrAdminController.js
const qrImageBuilder = require("../app/generator/qrImageBuilder");

const qrAdminController = {
  // Ham nay dung de cho admin test tao anh QR tu mot URL tuy chon.
  // Nhan vao: req.body.customUrl va res de gui ket qua ve frontend.
  // Tac dong: goi qrImageBuilder de tao anh Base64 va tra JSON phan hoi.
  generateTestQrImage: async (req, res) => {
    try {
      const { customUrl } = req.body;

      if (!customUrl) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp URL cần tạo mã QR!",
        });
      }

      const base64Image = await qrImageBuilder.generateBase64(customUrl);

      return res.status(200).json({
        success: true,
        message: "Tạo ảnh QR thành công",
        qrImageData: base64Image,
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
