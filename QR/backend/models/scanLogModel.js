const db = require("../config/database");

// Ham nay dung de chon executor phu hop cho query log scan, uu tien transaction neu co.
// Nhan vao: executor la connection/query executor tuy chon.
// Tra ve: executor se duoc dung khi thuc thi SQL.
const getExecutor = (executor) => executor || db;

const scanLogModel = {
  // Ham nay dung de ghi mot ban ghi scan vao bang scan_global_logs.
  // Nhan vao: scanLogPayload chua thong tin lan quet, options co the chua executor.
  // Tra ve: boolean cho biet lenh INSERT co thanh cong hay khong.
  async create(scanLogPayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        INSERT INTO scan_global_logs (
          log_id,
          qr_public_token_input,
          hidden_pin_input_hash,
          qr_id,
          batch_id,
          account_id,
          fingerprint_id,
          scan_type,
          scan_result,
          ip_address,
          location,
          device_info
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await executor.execute(query, [
        scanLogPayload.logId,
        scanLogPayload.qrPublicTokenInput,
        scanLogPayload.hiddenPinInputHash,
        scanLogPayload.qrId,
        scanLogPayload.batchId,
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
