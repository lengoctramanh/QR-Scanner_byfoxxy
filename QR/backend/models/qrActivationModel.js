const db = require("../config/database");

// Ham nay dung de chon executor phu hop cho query activation, uu tien transaction neu co.
// Nhan vao: executor la connection/query executor tuy chon.
// Tra ve: executor se duoc dung khi thuc thi SQL.
const getExecutor = (executor) => executor || db;

const qrActivationModel = {
  // Ham nay dung de tao ban ghi kich hoat secret QR dau tien.
  // Nhan vao: activationPayload chua du lieu kich hoat, options co the chua executor.
  // Tra ve: boolean cho biet lenh INSERT co thanh cong hay khong.
  async create(activationPayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        INSERT INTO qr_pin_activations (
          activation_id,
          qr_id,
          activated_by_account_id,
          activated_by_fingerprint_id,
          activation_ip
        )
        VALUES (?, ?, ?, ?, ?)
      `;

      const [result] = await executor.execute(query, [
        activationPayload.activationId,
        activationPayload.qrId,
        activationPayload.activatedByAccountId ?? null,
        activationPayload.activatedByFingerprintId ?? null,
        activationPayload.activationIp ?? null,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (create activation):", error);
      throw error;
    }
  },

  // Ham nay dung de lay ban ghi kich hoat cua mot QR theo qrId.
  // Nhan vao: qrId la ma QR, options co the chua executor va forUpdate.
  // Tra ve: ban ghi activation hoac null neu chua co trong DB.
  async findByQrId(qrId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const lockingClause = options.forUpdate ? " FOR UPDATE" : "";
      const query = `
        SELECT
          activation_id,
          qr_id,
          activated_by_account_id,
          activated_by_fingerprint_id,
          activation_ip,
          activated_at
        FROM qr_pin_activations
        WHERE qr_id = ?
        LIMIT 1${lockingClause}
      `;

      const [rows] = await executor.execute(query, [qrId]);
      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findByQrId):", error);
      throw error;
    }
  },
};

module.exports = qrActivationModel;
