const express = require("express");
const multer = require("multer");
const scanController = require("../controllers/scanController");
const { attachOptionalAuth } = require("../middlewares/authMiddleware");

// Ham nay dung de khoi tao router cho cac API quet QR cong khai va secret.
// Nhan vao: khong nhan tham so, su dung scanController da import.
// Tac dong: khai bao endpoint scanPublic va scanSecret.
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(attachOptionalAuth);
router.post("/resolve", scanController.resolveScan);
router.post("/resolve-image", upload.single("image"), scanController.resolveScanImage);
router.get("/public/:token", scanController.scanPublic);
router.post("/secret", scanController.scanSecret);
router.post("/preprocess-image", upload.single("image"), scanController.preprocessImage);
router.get("/preprocess-image/:pictureId", scanController.getPreprocessImageStatus);

module.exports = router;
