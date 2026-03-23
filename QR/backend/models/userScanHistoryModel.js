const db = require("../config/database");

// Ham nay dung de chon executor phu hop cho query lich su scan user.
// Nhan vao: executor transaction/query tuy chon.
// Tra ve: executor duoc su dung de thuc thi SQL.
const getExecutor = (executor) => executor || db;

const userScanHistoryModel = {
  // Ham nay dung de lien ket mot ban ghi master scan vao lich su ca nhan cua user.
  // Nhan vao: historyPayload chua userHistoryId, userId va logId.
  // Tra ve: boolean cho biet ban ghi da duoc tao hay chua.
  async createHistoryEntry(historyPayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        INSERT IGNORE INTO user_scan_history (
          user_history_id,
          user_id,
          log_id
        )
        VALUES (?, ?, ?)
      `;

      const [result] = await executor.execute(query, [
        historyPayload.userHistoryId,
        historyPayload.userId,
        historyPayload.logId,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (createUserScanHistoryEntry):", error);
      throw error;
    }
  },

  // Ham nay dung de xoa mem mot dong lich su scan cua user ma khong anh huong master log.
  // Nhan vao: userId la chu so huu va userHistoryId la ban ghi can an khoi dashboard.
  // Tra ve: true neu co dong duoc cap nhat thanh cong, nguoc lai la false.
  async softDeleteHistoryEntry(userId, userHistoryId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        UPDATE user_scan_history
        SET
          is_deleted_by_user = TRUE,
          deleted_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
          AND user_history_id = ?
          AND is_deleted_by_user = FALSE
      `;

      const [result] = await executor.execute(query, [userId, userHistoryId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (softDeleteHistoryEntry):", error);
      throw error;
    }
  },
};

module.exports = userScanHistoryModel;
