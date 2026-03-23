const authService = require("../services/authService");
const profileService = require("../services/profileService");
const userDashboardService = require("../services/userDashboardService");

const userController = {
  // Ham nay dung de nap du lieu dashboard that cho user dang dang nhap.
  // Nhan vao: req.auth.accountId va res de gui lich su scan/active codes ve frontend.
  // Tac dong: goi userDashboardService.getUserDashboard va tra JSON ket qua.
  async getDashboard(req, res) {
    try {
      const result = await userDashboardService.getUserDashboard(req.auth?.accountId);

      if (!result.isValid) {
        return res.status(result.httpStatus).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("Controller Error (getUserDashboard):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Ham nay dung de luu thay doi profile hien tai cho user hoac brand tu form settings.
  // Nhan vao: req.auth, req.body va req.files da duoc multer parse tu multipart/form-data.
  // Tac dong: goi profileService.updateCurrentProfile va tra profile moi nhat ve frontend.
  async updateProfile(req, res) {
    try {
      const result = await profileService.updateCurrentProfile({
        accountId: req.auth?.accountId,
        role: req.auth?.role,
        body: req.body,
        files: req.files,
      });

      if (!result.isValid) {
        return res.status(result.httpStatus).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("Controller Error (updateProfile):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Ham nay dung de xu ly yeu cau doi mat khau tu trang ca nhan cua nguoi dung da dang nhap.
  // Nhan vao: req.auth.accountId va req.body chua currentPassword/newPassword/confirmPassword.
  // Tac dong: goi authService.changePassword va tra JSON thanh cong hoac loi ve client.
  async changePassword(req, res) {
    try {
      const result = await authService.changePassword({
        accountId: req.auth?.accountId,
        currentPassword: req.body?.currentPassword,
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
      console.error("Controller Error (changePassword):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Ham nay dung de claim Token(2) cho user dang dang nhap va gan QR vao tai khoan neu hop le.
  // Nhan vao: req.auth.accountId va req.body.token.
  // Tac dong: goi userDashboardService.claimGuestTokenForUser va tra JSON cho frontend.
  async claimGuestToken(req, res) {
    try {
      const result = await userDashboardService.claimGuestTokenForUser(
        req.auth?.accountId,
        req.body?.token,
      );

      if (!result.isValid) {
        return res.status(result.httpStatus).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("Controller Error (claimGuestToken):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Ham nay dung de xoa mem mot dong lich su scan cua user tren dashboard.
  // Nhan vao: req.auth.accountId va req.params.userHistoryId.
  // Tac dong: goi userDashboardService.deleteScanHistoryItem va tra ket qua cho client.
  async deleteScanHistory(req, res) {
    try {
      const result = await userDashboardService.deleteScanHistoryItem(
        req.auth?.accountId,
        req.params?.userHistoryId,
      );

      if (!result.isValid) {
        return res.status(result.httpStatus).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("Controller Error (deleteScanHistory):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },
};

module.exports = userController;
