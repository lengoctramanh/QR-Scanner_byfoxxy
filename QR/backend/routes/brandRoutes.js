const express = require("express");
const router = express.Router();
const {
  getProfile,
  changePassword,
} = require("../controllers/brandController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/profile", verifyToken, getProfile);
router.put("/change-password", verifyToken, changePassword);

module.exports = router;
