const authService = require("../services/authService");

const authForgotPassword = {
  // Ham nay dung de xu ly API yeu cau gui OTP dat lai mat khau.
  // Nhan vao: req chua identifier can khoi phuc va res de gui phan hoi.
  // Tac dong: goi authService.requestPasswordResetOtp va tra ket qua JSON cho client.
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
