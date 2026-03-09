const db = require("../config/db");
const bcrypt = require("bcryptjs");

const getProfile = async (req, res) => {
  try {
    const { accountId, role } = req.user;
    if (role !== "brand")
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền truy cập!" });
    const query = `SELECT a.email, a.phone, a.avatar_url, b.business_name, b.tax_id, b.headquarters_address, b.website 
                   FROM accounts a JOIN brands b ON a.account_id = b.account_id 
                   WHERE a.account_id = ?`;

    const [results] = await db.query(query, [accountId]);
    if (results.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy Brand" });

    res.status(200).json({ success: true, data: results[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi Server!" });
  }
};

const changePassword = async (req, res) => {};

module.exports = { getProfile, changePassword };
