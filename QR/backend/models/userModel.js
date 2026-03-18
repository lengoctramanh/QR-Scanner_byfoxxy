const db = require("../config/database");

const getExecutor = (executor) => executor || db;

const userModel = {
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
