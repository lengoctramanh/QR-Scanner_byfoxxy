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
};

module.exports = userModel;
