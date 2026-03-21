const db = require("../config/database");

// Ham nay dung de chon executor phu hop cho query session, uu tien transaction neu co.
// Nhan vao: executor la connection/query executor tuy chon.
// Tra ve: executor se duoc dung de thuc thi SQL.
const getExecutor = (executor) => executor || db;

const accountSessionModel = {
  // Ham nay dung de tao mot session dang nhap moi trong bang account_sessions.
  // Nhan vao: sessionPayload chua sessionId, accountId, tokenHash va metadata; options co the chua executor.
  // Tra ve: boolean cho biet ban ghi session co duoc them vao DB hay khong.
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

      const [result] = await executor.execute(query, [sessionPayload.sessionId, sessionPayload.accountId, sessionPayload.tokenHash, sessionPayload.deviceInfo, sessionPayload.deviceType, sessionPayload.ipAtLogin, sessionPayload.locationAtLogin]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (createSession):", error);
      throw error;
    }
  },

  // Ham nay dung de tim session hop le theo tokenHash, chi lay session chua revoke va chua het han.
  // Nhan vao: tokenHash la gia tri da hash cua raw token, options co the chua executor.
  // Tra ve: ban ghi session dang hoat dong hoac null neu khong tim thay.
  async findActiveSessionByTokenHash(tokenHash, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          session_id,
          account_id,
          device_info,
          device_type,
          ip_at_login,
          location_at_login,
          created_at,
          last_active_at,
          expires_at,
          is_revoked,
          revoked_at,
          revoked_reason
        FROM account_sessions
        WHERE token_hash = ?
          AND is_revoked = FALSE
          AND expires_at > CURRENT_TIMESTAMP
        LIMIT 1
      `;
      const [rows] = await executor.execute(query, [tokenHash]);
      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findActiveSessionByTokenHash):", error);
      throw error;
    }
  },

  // Ham nay dung de cap nhat moc thoi gian hoat dong gan nhat cua session.
  // Nhan vao: sessionId la ma phien can update, options co the chua executor.
  // Tra ve: boolean cho biet lenh UPDATE co thanh cong hay khong.
  async touchLastActive(sessionId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        UPDATE account_sessions
        SET last_active_at = CURRENT_TIMESTAMP
        WHERE session_id = ?
      `;
      const [result] = await executor.execute(query, [sessionId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (touchLastActive):", error);
      throw error;
    }
  },
};

module.exports = accountSessionModel;
