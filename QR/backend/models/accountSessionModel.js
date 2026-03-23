const db = require("../config/database");
const SESSION_TTL_DAYS = 4;

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
        SET
          last_active_at = CURRENT_TIMESTAMP,
          expires_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ${SESSION_TTL_DAYS} DAY)
        WHERE session_id = ?
      `;
      const [result] = await executor.execute(query, [sessionId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (touchLastActive):", error);
      throw error;
    }
  },

  // Ham nay dung de revoke toan bo session dang ton tai cua mot tai khoan.
  // Nhan vao: accountId, revokedReason va options co the chua executor.
  // Tra ve: boolean cho biet co session nao bi cap nhat hay khong.
  async revokeSessionsByAccountId(accountId, revokedReason, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        UPDATE account_sessions
        SET
          is_revoked = TRUE,
          revoked_at = CURRENT_TIMESTAMP,
          revoked_reason = ?
        WHERE account_id = ?
          AND is_revoked = FALSE
      `;
      const [result] = await executor.execute(query, [revokedReason || "Session revoked.", accountId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (revokeSessionsByAccountId):", error);
      throw error;
    }
  },

  // Ham nay dung de lay snapshot cac phien dang hoat dong kem thong tin account cho dashboard admin.
  // Nhan vao: options co the chua executor de dung transaction khi can.
  // Tra ve: mang session chua bi revoke va chua het han, sap xep theo lan hoat dong moi nhat.
  async listActiveSessions(options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          s.session_id,
          s.account_id,
          a.full_name,
          a.email,
          a.role,
          a.status,
          s.device_info,
          s.device_type,
          s.ip_at_login,
          s.location_at_login,
          s.created_at AS session_created,
          s.last_active_at,
          s.expires_at,
          GREATEST(TIMESTAMPDIFF(MINUTE, CURRENT_TIMESTAMP, s.expires_at), 0) AS minutes_until_expire
        FROM account_sessions AS s
        INNER JOIN accounts AS a
          ON a.account_id = s.account_id
        WHERE s.is_revoked = FALSE
          AND s.expires_at > CURRENT_TIMESTAMP
        ORDER BY s.last_active_at DESC, s.created_at DESC
      `;

      const [rows] = await executor.execute(query);
      return rows;
    } catch (error) {
      console.error("Model Error (listActiveSessions):", error);
      throw error;
    }
  },

  // Ham nay dung de thu hoi mot session cu the tu dashboard admin.
  // Nhan vao: sessionId can revoke, revokedReason mo ta ly do va options co the chua executor.
  // Tra ve: true neu lenh UPDATE co anh huong den session dang song.
  async revokeSessionById(sessionId, revokedReason, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        UPDATE account_sessions
        SET
          is_revoked = TRUE,
          revoked_at = CURRENT_TIMESTAMP,
          revoked_reason = ?
        WHERE session_id = ?
          AND is_revoked = FALSE
      `;

      const [result] = await executor.execute(query, [
        revokedReason || "Revoked by admin.",
        sessionId,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (revokeSessionById):", error);
      throw error;
    }
  },
};

module.exports = accountSessionModel;
