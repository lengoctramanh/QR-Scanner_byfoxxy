const db = require("../config/database");

const getExecutor = (executor) => executor || db;

const qrActivationModel = {
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
        activationPayload.activatedByAccountId,
        activationPayload.activatedByFingerprintId,
        activationPayload.activationIp,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (create activation):", error);
      throw error;
    }
  },

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
