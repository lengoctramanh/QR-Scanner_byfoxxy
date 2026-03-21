const express = require("express");
const multer = require("multer");

const authForgotPasswordController = require("../controllers/authForgotPassword");
const authLoginController = require("../controllers/authLogin");
const authRegisterController = require("../controllers/authRegister");
const { requireAuth } = require("../middlewares/authMiddleware");

// Ham nay dung de khoi tao router cho cac API xac thuc va dang ky.
// Nhan vao: khong nhan tham so, su dung middleware/controller da import.
// Tac dong: khai bao cac endpoint login, register va forgot-password.
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/login", authLoginController.login);
router.post("/register", upload.any(), authRegisterController.register);
router.post("/forgot-password", authForgotPasswordController.requestOtp);
router.get("/me", requireAuth, authLoginController.getMe);

module.exports = router;
