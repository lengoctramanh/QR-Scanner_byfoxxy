const adminSystemService = require("../services/adminSystemService");

const adminSystemController = {
  // Ham nay dung de tra snapshot he thong that cho dashboard admin.
  // Nhan vao: req, res cua Express.
  // Tac dong: goi adminSystemService.getSystemSummary va tra JSON ve frontend.
  async getSystemSummary(req, res) {
    try {
      const result = await adminSystemService.getSystemSummary();

      if (!result.isValid) {
        return res.status(result.httpStatus).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("Controller Error (getSystemSummary):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Ham nay dung de revoke mot session cu the bang quyen admin.
  // Nhan vao: req.params.sessionId va req.auth.accountId.
  // Tac dong: goi adminSystemService.revokeSession va tra ket qua cho client.
  async revokeSession(req, res) {
    try {
      const result = await adminSystemService.revokeSession(
        req.params?.sessionId,
        req.auth?.accountId,
      );

      if (!result.isValid) {
        return res.status(result.httpStatus).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("Controller Error (revokeSession):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },
};

module.exports = adminSystemController;
