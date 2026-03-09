const db = require("../config/db");
const bcrypt = require("bcryptjs");

const getProfile = async (req, res) => {
  try {
    const { accountId, role } = req.user;

    let query = "";
    if (role === "user") {
      query = `SELECT a.email, a.phone, a.avatar_url, u.full_name, u.dob, u.gender 
               FROM accounts a JOIN users u ON a.account_id = u.account_id 
               WHERE a.account_id = ?`;
    }

    const [results] = await db.query(query, [accountId]);

    if (results.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy User" });

    res.status(200).json({ success: true, data: results[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi Server!" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const { accountId } = req.user;

    const [users] = await db.query(
      "SELECT password_hash FROM accounts WHERE account_id = ?",
      [accountId],
    );

    const isMatch = await bcrypt.compare(oldPassword, users[0].password_hash);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Mật khẩu cũ không chính xác!" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query(
      "UPDATE accounts SET password_hash = ? WHERE account_id = ?",
      [hashedPassword, accountId],
    );

    res
      .status(200)
      .json({ success: true, message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi Server!" });
  }
};

module.exports = { getProfile, changePassword };
