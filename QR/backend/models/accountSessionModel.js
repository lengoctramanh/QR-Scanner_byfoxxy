const db = require("../config/database");

const getExecutor = (executor) => executor || db;

const accountSessionModel = {
  async createSession(sessionPayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        INSERT INTO account_sessions (
          session_id,
          account_id,
          token_hash,
          device_info,
          device_type,
          ip_at_login,
          location_at_login,
          last_active_at,
          expires_at
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          CURRENT_TIMESTAMP,
          DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 4 DAY)
        )
      `;

      const [result] = await executor.execute(query, [
        sessionPayload.sessionId,
        sessionPayload.accountId,
        sessionPayload.tokenHash,
        sessionPayload.deviceInfo,
        sessionPayload.deviceType,
        sessionPayload.ipAtLogin,
        sessionPayload.locationAtLogin,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (createSession):", error);
      throw error;
    }
  },
};

module.exports = accountSessionModel;
