const authService = require("../services/authService");

const authForgotPassword = {
  async requestOtp(req, res) {
    try {
      const result = await authService.requestPasswordResetOtp(req.body?.identifier);

      if (!result.isValid) {
        return res.status(result.httpStatus).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("Controller Error (forgot password):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },
};

module.exports = authForgotPassword;
