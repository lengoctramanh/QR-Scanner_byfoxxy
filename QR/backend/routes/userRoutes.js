const express = require("express");
const multer = require("multer");

const brandProductController = require("../controllers/brandProductController");
const userController = require("../controllers/userController");
const { requireAuth, requireRole } = require("../middlewares/authMiddleware");

// Ham nay dung de khai bao cac route thao tac tai khoan trong trang ca nhan.
// Nhan vao: khong nhan tham so, su dung middleware requireAuth de bao ve route.
// Tac dong: dang ky endpoint doi mat khau cho tai khoan dang dang nhap.
const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.put(
  "/profile",
  requireAuth,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  userController.updateProfile,
);
router.get("/user/dashboard", requireAuth, requireRole("user"), userController.getDashboard);
router.post("/user/claim-token", requireAuth, requireRole("user"), userController.claimGuestToken);
router.delete("/user/history/:userHistoryId", requireAuth, requireRole("user"), userController.deleteScanHistory);
router.post("/change-password", requireAuth, userController.changePassword);
router.get("/brand/products", requireAuth, requireRole("brand"), brandProductController.listProducts);
router.get("/brand/products/template", requireAuth, requireRole("brand"), brandProductController.downloadBatchTemplate);
router.post("/brand/products", requireAuth, requireRole("brand"), brandProductController.createProductWithQr);
router.post(
  "/brand/products/batch-upload",
  requireAuth,
  requireRole("brand"),
  upload.single("batchFile"),
  brandProductController.uploadProductBatchFile,
);
router.get("/brand/batches/:batchId/export", requireAuth, requireRole("brand"), brandProductController.exportBatchZip);

module.exports = router;
