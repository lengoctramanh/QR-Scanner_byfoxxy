const express = require("express");
const multer = require("multer");

const authForgotPasswordController = require("../controllers/authForgotPassword");
const authLoginController = require("../controllers/authLogin");
const authRegisterController = require("../controllers/authRegister");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/login", authLoginController.login);
router.post("/register", upload.any(), authRegisterController.register);
router.post("/forgot-password", authForgotPasswordController.requestOtp);

module.exports = router;
