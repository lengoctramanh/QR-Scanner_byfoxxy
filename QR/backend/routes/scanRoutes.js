const express = require("express");
const multer = require("multer");
const scanController = require("../controllers/scanController");

// Ham nay dung de khoi tao router cho cac API quet QR cong khai va secret.
// Nhan vao: khong nhan tham so, su dung scanController da import.
// Tac dong: khai bao endpoint scanPublic va scanSecret.
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/public/:token", scanController.scanPublic);
router.post("/secret", scanController.scanSecret);
router.post("/preprocess-image", upload.single("image"), scanController.preprocessImage);

module.exports = router;
