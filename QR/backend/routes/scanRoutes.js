const express = require("express");
const scanController = require("../controllers/scanController");

const router = express.Router();

router.get("/public/:token", scanController.scanPublic);
router.post("/secret", scanController.scanSecret);

module.exports = router;
