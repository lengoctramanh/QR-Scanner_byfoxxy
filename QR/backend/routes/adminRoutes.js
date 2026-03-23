const express = require("express");

const adminBrandRegistrationController = require("../controllers/adminBrandRegistrationController");
const adminSystemController = require("../controllers/adminSystemController");
const adminWebsiteQrController = require("../controllers/adminWebsiteQrController");
const { requireAuth, requireRole } = require("../middlewares/authMiddleware");

// Ham nay dung de khoi tao router danh cho cac API quan tri cua admin.
// Nhan vao: khong nhan tham so, su dung middleware xac thuc va controller da import.
// Tac dong: rang buoc route admin va khai bao cac endpoint review brand registration.
const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/website-qr", adminWebsiteQrController.getConfig);
router.put("/website-qr", adminWebsiteQrController.updateConfig);
router.get("/system-summary", adminSystemController.getSystemSummary);
router.post("/sessions/:sessionId/revoke", adminSystemController.revokeSession);

router.get(
  "/brand-registration-requests",
  adminBrandRegistrationController.listRequests
);
router.get(
  "/brand-registration-requests/:requestId",
  adminBrandRegistrationController.getRequestDetail
);
router.post(
  "/brand-registration-requests/:requestId/create-account",
  adminBrandRegistrationController.createAccount
);
router.post(
  "/brand-registration-requests/:requestId/reject",
  adminBrandRegistrationController.rejectRequest
);

module.exports = router;
