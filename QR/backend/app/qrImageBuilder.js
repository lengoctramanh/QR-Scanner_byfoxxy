const QRCode = require("qrcode");

const qrImageBuilder = {
  /**
   * Nhận vào một URL bất kỳ và trả về hình ảnh QR code dưới dạng Base64
   * @param {string} dynamicUrl - Đường link do Admin nhập vào
   * @returns {Promise<string>} - Chuỗi Base64 của ảnh QR
   */
  generateBase64: async (dynamicUrl) => {
    try {
      // Cấu hình mã QR: Mức sửa lỗi cao nhất (H), viền nhỏ, kích thước 300x300
      const qrImageBase64 = await QRCode.toDataURL(dynamicUrl, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 300,
        color: {
          dark: "#1e293b", // Màu của mã QR (đang để màu xanh đen cho đẹp)
          light: "#ffffff", // Màu nền
        },
      });

      return qrImageBase64;
    } catch (err) {
      console.error("Lỗi khi vẽ ảnh QR:", err);
      throw new Error("Không thể tạo hình ảnh QR");
    }
  },
};

module.exports = qrImageBuilder;
