const db = require("../config/database");

const getExecutor = (executor) => executor || db;

const accountModel = {
  async checkExist(emailOrPhone, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query =
        "SELECT account_id FROM accounts WHERE email = ? OR phone = ? LIMIT 1";
      const [rows] = await executor.execute(query, [emailOrPhone, emailOrPhone]);
      return rows.length > 0;
    } catch (error) {
      console.error("Model Error (checkExist):", error);
      throw error;
    }
  },

  async findByIdentifier(identifier, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          a.account_id,
          a.full_name,
          a.email,
          a.phone,
          a.password_hash,
          a.role,
          a.status,
          a.avatar_url,
          a.last_login_at,
          b.brand_id,
          b.brand_name,
          b.verified,
          NULL AS verification_status
        FROM accounts AS a
        LEFT JOIN brands AS b
          ON b.account_id = a.account_id
        WHERE a.email = ? OR a.phone = ?
        LIMIT 1
      `;
      const [rows] = await executor.execute(query, [identifier, identifier]);
      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findByIdentifier):", error);
      throw error;
    }
  },

  async findByAccountId(accountId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          account_id,
          full_name,
          email,
          phone,
          role,
          status
        FROM accounts
        WHERE account_id = ?
        LIMIT 1
      `;
      const [rows] = await executor.execute(query, [accountId]);
      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findByAccountId):", error);
      throw error;
    }
  },

  async createAccount(accountPayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        INSERT INTO accounts (
          account_id,
          full_name,
          dob,
          gender,
          email,
          phone,
          password_hash,
          role,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await executor.execute(query, [
        accountPayload.accountId,
        accountPayload.fullName,
        accountPayload.dob,
        accountPayload.gender,
        accountPayload.email,
        accountPayload.phone,
        accountPayload.passwordHash,
        accountPayload.role,
        accountPayload.status,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (createAccount):", error);
      throw error;
    }
  },

  async touchLastLogin(accountId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        UPDATE accounts
        SET last_login_at = CURRENT_TIMESTAMP
        WHERE account_id = ?
      `;
      const [result] = await executor.execute(query, [accountId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (touchLastLogin):", error);
      throw error;
    }
  },
};

module.exports = accountModel;
