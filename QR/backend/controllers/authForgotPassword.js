const authService = require("../services/authService");

const authForgotPassword = {
  // Ham nay dung de xu ly API yeu cau gui OTP dat lai mat khau.
  // Nhan vao: req chua identifier can khoi phuc va res de gui phan hoi.
  // Tac dong: goi authService.requestPasswordResetOtp va tra ket qua JSON cho client.
  async requestOtp(req, res) {
    try {
      const result = await authService.requestPasswordResetOtp(req.body?.email || req.body?.identifier);

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

  // Ham nay dung de xu ly API xac minh OTP va cap reset token cho frontend.
  // Nhan vao: req chua identifier/email va otp; res de gui ket qua JSON.
  // Tac dong: goi authService.verifyPasswordResetOtp va tra phan hoi tuong ung.
  async verifyOtp(req, res) {
    try {
      const result = await authService.verifyPasswordResetOtp({
        identifier: req.body?.email || req.body?.identifier,
        otp: req.body?.otp,
      });

      if (!result.isValid) {
        return res.status(result.httpStatus).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("Controller Error (verifyOtp):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Ham nay dung de xu ly API dat lai mat khau moi bang reset token.
  // Nhan vao: req chua resetToken, newPassword, confirmPassword va res de gui ket qua.
  // Tac dong: goi authService.resetPasswordWithToken va tra JSON cho client.
  async resetPassword(req, res) {
    try {
      const result = await authService.resetPasswordWithToken({
        resetToken: req.body?.resetToken,
        newPassword: req.body?.newPassword,
        confirmPassword: req.body?.confirmPassword,
      });

      if (!result.isValid) {
        return res.status(result.httpStatus).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("Controller Error (resetPassword):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },
};

module.exports = authForgotPassword;
