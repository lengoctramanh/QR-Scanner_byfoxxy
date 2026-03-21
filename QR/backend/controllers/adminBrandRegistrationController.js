const brandRegistrationRequestService = require("../services/brandRegistrationRequestService");

const adminBrandRegistrationController = {
  // Ham nay dung de tra danh sach yeu cau dang ky brand cho admin.
  // Nhan vao: req chua bo loc status trong query va res de gui du lieu.
  // Tac dong: goi service lay danh sach request va tra JSON.
  async listRequests(req, res) {
    try {
      const result = await brandRegistrationRequestService.listRequests({
        status: req.query.status,
      });

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
      console.error("Controller Error (listRequests):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Ham nay dung de tra chi tiet mot yeu cau dang ky brand theo requestId.
  // Nhan vao: req.params.requestId va res de gui phan hoi.
  // Tac dong: goi service lay chi tiet request va tra JSON ket qua.
  async getRequestDetail(req, res) {
    try {
      const result = await brandRegistrationRequestService.getRequestById(
        req.params.requestId
      );

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
      console.error("Controller Error (getRequestDetail):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Ham nay dung de tao tai khoan brand tu mot yeu cau dang ky da duoc admin duyet.
  // Nhan vao: req chua requestId, thong tin admin va res de gui ket qua.
  // Tac dong: goi service tao account/brand va tra JSON phan hoi cho client.
  async createAccount(req, res) {
    try {
      const result = await brandRegistrationRequestService.createAccountFromRequest(
        {
          requestId: req.params.requestId,
          adminAccountId: req.auth?.accountId || req.body.adminAccountId,
          adminNote: req.body.adminNote,
        }
      );

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
      console.error("Controller Error (createAccount):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Ham nay dung de tu choi mot yeu cau dang ky brand.
  // Nhan vao: req chua requestId, adminAccountId, adminNote va res de gui phan hoi.
  // Tac dong: goi service cap nhat trang thai request thanh rejected.
  async rejectRequest(req, res) {
    try {
      const result = await brandRegistrationRequestService.rejectRequest({
        requestId: req.params.requestId,
        adminAccountId: req.auth?.accountId || req.body.adminAccountId,
        adminNote: req.body.adminNote,
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
      });
    } catch (error) {
      console.error("Controller Error (rejectRequest):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },
};

module.exports = adminBrandRegistrationController;
