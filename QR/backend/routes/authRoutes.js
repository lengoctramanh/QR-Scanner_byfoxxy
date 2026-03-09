const express = require("express");
const router = express.Router();
const { register } = require("../controllers/registerController");
const { login } = require("../controllers/loginController");

const {
  forgotPassword,
  verifyOTP,
  resetPassword,
} = require("../controllers/recoveryController");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

module.exports = router;
