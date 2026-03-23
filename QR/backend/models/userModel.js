const db = require("../config/database");

// Ham nay dung de chon executor phu hop cho query user, uu tien transaction neu co.
// Nhan vao: executor la connection/query executor tuy chon.
// Tra ve: executor se duoc dung khi thuc thi SQL.
const getExecutor = (executor) => executor || db;

const userModel = {
  // Ham nay dung de tao ho so user mac dinh sau khi tao tai khoan moi.
  // Nhan vao: userId, accountId va options co the chua executor.
  // Tra ve: boolean cho biet ban ghi user co duoc them vao DB hay khong.
  async createUserProfile(userId, accountId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        INSERT INTO users (user_id, account_id)
        VALUES (?, ?)
      `;

      const [result] = await executor.execute(query, [userId, accountId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (createUserProfile):", error);
      throw error;
    }
  },

  // Ham nay dung de tim ho so user theo accountId de lien ket scan va bo suu tap ca nhan.
  // Nhan vao: accountId la ma tai khoan va options co the chua executor.
  // Tra ve: ban ghi user profile hoac null neu khong ton tai.
  async findByAccountId(accountId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          u.user_id,
          u.account_id,
          a.full_name,
          a.email,
          a.phone
        FROM users AS u
        INNER JOIN accounts AS a
          ON a.account_id = u.account_id
        WHERE u.account_id = ?
        LIMIT 1
      `;

      const [rows] = await executor.execute(query, [accountId]);
      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findUserByAccountId):", error);
      throw error;
    }
  },
};

module.exports = userModel;
