const QRCode = require("qrcode");

const qrImageBuilder = {
  // Ham nay dung de tao anh QR dang Base64 tu mot URL bat ky.
  // Nhan vao: dynamicUrl la duong dan can ma hoa thanh QR.
  // Tra ve: Promise tra ve chuoi data URL Base64 cua anh QR.
  generateBase64: async (dynamicUrl) => {
    try {
      const qrImageBase64 = await QRCode.toDataURL(dynamicUrl, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 300,
        color: {
          dark: "#1e293b",
          light: "#ffffff",
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
