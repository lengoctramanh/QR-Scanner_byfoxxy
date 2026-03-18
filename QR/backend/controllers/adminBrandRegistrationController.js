const brandRegistrationRequestService = require("../services/brandRegistrationRequestService");

const adminBrandRegistrationController = {
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

  async createAccount(req, res) {
    try {
      const result = await brandRegistrationRequestService.createAccountFromRequest(
        {
          requestId: req.params.requestId,
          adminAccountId: req.body.adminAccountId,
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

  async rejectRequest(req, res) {
    try {
      const result = await brandRegistrationRequestService.rejectRequest({
        requestId: req.params.requestId,
        adminAccountId: req.body.adminAccountId,
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
