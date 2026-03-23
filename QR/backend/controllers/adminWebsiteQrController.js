const adminWebsiteQrService = require("../services/adminWebsiteQrService");

const adminWebsiteQrController = {
  // Ham nay dung de tra cau hinh website QR hien tai va lich su cho dashboard admin.
  // Nhan vao: req/res cua Express, khong can body.
  // Tac dong: goi service doc du lieu va tra JSON cho frontend.
  async getConfig(req, res) {
    try {
      const result = await adminWebsiteQrService.getWebsiteQrConfig();

      if (!result.isValid) {
        return res.status(result.httpStatus).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(result.httpStatus).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error("Controller Error (getWebsiteQrConfig):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Ham nay dung de nhan URL moi tu admin, sinh file QR va luu lich su thay doi.
  // Nhan vao: req.auth.accountId va req.body.websiteUrl tu client.
  // Tac dong: goi service cap nhat cau hinh website QR roi tra ket qua ve frontend.
  async updateConfig(req, res) {
    try {
      const result = await adminWebsiteQrService.updateWebsiteQrConfig({
        websiteUrl: req.body?.websiteUrl,
        adminAccountId: req.auth?.accountId,
      });

      if (!result.isValid) {
        return res.status(result.httpStatus).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(result.httpStatus).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Controller Error (updateWebsiteQrConfig):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },
};

module.exports = adminWebsiteQrController;
