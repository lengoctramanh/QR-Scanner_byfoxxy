const db = require("../config/database");

const getExecutor = (executor) => executor || db;

const scanLogModel = {
  async create(scanLogPayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        INSERT INTO scan_global_logs (
          log_id,
          qr_public_token_input,
          hidden_pin_input_hash,
          qr_id,
          account_id,
          fingerprint_id,
          scan_type,
          scan_result,
          ip_address,
          location,
          device_info
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await executor.execute(query, [
        scanLogPayload.logId,
        scanLogPayload.qrPublicTokenInput,
        scanLogPayload.hiddenPinInputHash,
        scanLogPayload.qrId,
        scanLogPayload.accountId,
        scanLogPayload.fingerprintId,
        scanLogPayload.scanType,
        scanLogPayload.scanResult,
        scanLogPayload.ipAddress,
        scanLogPayload.location,
        scanLogPayload.deviceInfo,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (create scan log):", error);
      throw error;
    }
  },
};

module.exports = scanLogModel;
