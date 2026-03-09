const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const [users] = await db.query(
      "SELECT * FROM accounts WHERE email = ? OR phone = ?",
      [identifier, identifier],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Account no exist, please check",
      });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "password failed",
      });
    }

    const payload = {
      accountId: user.accountId,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      success: true,
      message: "Successfully",
      token: token,
      data: {
        account_id: user.account_id,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login API error", error);
    res.status(500).json({ success: false, message: "Lỗi Server cục bộ!" });
  }
};
module.exports = { login };
