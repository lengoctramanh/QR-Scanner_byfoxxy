const db = require("../config/db");
const bcrypt = require("bcryptjs");

const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;

    const [users] = await db.query(
      "SELECT * FROM accounts WHERE email = ? OR phone = ?",
      [identifier, identifier],
    );

    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Tài khoản không tồn tại!" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiryTime = new Date(Date.now() + 120 * 1000);

    await db.query(
      "UPDATE accounts SET reset_otp = ?, otp_expiry = ? WHERE account_id = ?",
      [otp, expiryTime, users[0].account_id],
    );

    console.log(`\n================================`);
    console.log(`[MÔ PHỎNG SMS/EMAIL] Mã OTP của ${identifier} là: ${otp}`);
    console.log(`================================\n`);

    res.status(200).json({ success: true, message: "Mã OTP đã được gửi!" });
  } catch (error) {
    console.error("Lỗi forgotPassword:", error);
    res.status(500).json({ success: false, message: "Lỗi Server!" });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    const [users] = await db.query(
      "SELECT * FROM accounts WHERE (email = ? OR phone = ?) AND reset_otp = ?",
      [identifier, identifier, otp],
    );

    if (users.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Mã OTP không hợp lệ!" });
    }

    const now = new Date();
    if (now > users[0].otp_expiry) {
      return res
        .status(400)
        .json({ success: false, message: "Mã OTP đã hết hạn (quá 120s)!" });
    }

    res
      .status(200)
      .json({ success: true, message: "OTP hợp lệ, vui lòng đổi mật khẩu." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi Server!" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { identifier, newPassword } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query(
      "UPDATE accounts SET password_hash = ?, reset_otp = NULL, otp_expiry = NULL WHERE email = ? OR phone = ?",
      [hashedPassword, identifier, identifier],
    );

    res
      .status(200)
      .json({ success: true, message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi Server!" });
  }
};

module.exports = { forgotPassword, verifyOTP, resetPassword };
