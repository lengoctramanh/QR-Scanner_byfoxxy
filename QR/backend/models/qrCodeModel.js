const db = require("../config/database");

// Ham nay dung de chon executor phu hop cho query QR, uu tien transaction neu co.
// Nhan vao: executor la connection/query executor tuy chon.
// Tra ve: executor se duoc dung de thuc thi SQL.
const getExecutor = (executor) => executor || db;

const baseOverviewQuery = `
  SELECT
    q.qr_id,
    q.qr_public_token,
    q.hidden_pin_hash,
    q.status,
    q.effective_from,
    q.activated_at,
    q.expires_at,
    q.scan_limit,
    q.total_public_scans,
    q.total_pin_attempts,
    p.product_id,
    p.product_name,
    p.description,
    p.image_url,
    p.general_info_url,
    p.manufacturer_name,
    p.origin_country,
    p.quality_certifications,
    b.brand_id,
    b.brand_name,
    bt.batch_id,
    bt.batch_code,
    bt.manufacture_date,
    bt.expiry_date
  FROM qr_codes q
  INNER JOIN products p ON q.product_id = p.product_id
  INNER JOIN brands b ON p.brand_id = b.brand_id
  INNER JOIN batches bt ON q.batch_id = bt.batch_id
  WHERE q.qr_public_token = ?
  LIMIT 1
`;

const qrCodeModel = {
  // Ham nay dung de tao mot ban ghi QR xac thuc moi trong bang qr_codes.
  // Nhan vao: qrCodePayload chua du lieu QR moi va options co the chua executor.
  // Tra ve: boolean cho biet lenh INSERT co thanh cong hay khong.
  async createQrCode(qrCodePayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        INSERT INTO qr_codes (
          qr_id,
          qr_public_token,
          hidden_pin_hash,
          source,
          product_id,
          batch_id,
          request_id,
          status,
          effective_from,
          scan_limit
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await executor.execute(query, [
        qrCodePayload.qrId,
        qrCodePayload.qrPublicToken,
        qrCodePayload.hiddenPinHash,
        qrCodePayload.source,
        qrCodePayload.productId,
        qrCodePayload.batchId,
        qrCodePayload.requestId,
        qrCodePayload.status,
        qrCodePayload.effectiveFrom,
        qrCodePayload.scanLimit,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (createQrCode):", error);
      throw error;
    }
  },

  // Ham nay dung de chen hang loat QR cho mot lo hang moi trong mot lenh SQL de toi uu toc do.
  // Nhan vao: qrCodePayloads la mang QR rows da duoc chuan hoa va options co the chua executor.
  // Tra ve: so dong da duoc chen thanh cong vao bang qr_codes.
  async bulkCreateQrCodes(qrCodePayloads = [], options = {}) {
    if (!Array.isArray(qrCodePayloads) || !qrCodePayloads.length) {
      return 0;
    }

    try {
      const executor = getExecutor(options.executor);
      const placeholders = qrCodePayloads.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
      const query = `
        INSERT INTO qr_codes (
          qr_id,
          qr_public_token,
          hidden_pin_hash,
          source,
          product_id,
          batch_id,
          request_id,
          status,
          effective_from,
          scan_limit
        )
        VALUES ${placeholders}
      `;

      const values = qrCodePayloads.flatMap((qrCodePayload) => [
        qrCodePayload.qrId,
        qrCodePayload.qrPublicToken,
        qrCodePayload.hiddenPinHash,
        qrCodePayload.source,
        qrCodePayload.productId,
        qrCodePayload.batchId,
        qrCodePayload.requestId,
        qrCodePayload.status,
        qrCodePayload.effectiveFrom,
        qrCodePayload.scanLimit,
      ]);

      const [result] = await executor.execute(query, values);
      return result.affectedRows || 0;
    } catch (error) {
      console.error("Model Error (bulkCreateQrCodes):", error);
      throw error;
    }
  },

  // Ham nay dung de lay du lieu tong hop cua QR theo public token.
  // Nhan vao: publicToken la ma cong khai can tim, options co the chua executor va forUpdate.
  // Tra ve: ban ghi overview cua QR hoac null neu khong tim thay trong DB.
  async findOverviewByPublicToken(publicToken, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const lockingClause = options.forUpdate ? " FOR UPDATE" : "";
      const [rows] = await executor.execute(
        `${baseOverviewQuery}${lockingClause}`,
        [publicToken]
      );

      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findOverviewByPublicToken):", error);
      throw error;
    }
  },

  // Ham nay dung de tang so lan quet public cua mot ma QR xac thuc.
  // Nhan vao: qrId la ma QR can tang counter va options co the chua executor.
  // Tra ve: boolean cho biet lenh UPDATE co thanh cong hay khong.
  async incrementPublicScanCount(qrId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        UPDATE qr_codes
        SET total_public_scans = total_public_scans + 1
        WHERE qr_id = ?
      `;
      const [result] = await executor.execute(query, [qrId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (incrementPublicScanCount):", error);
      throw error;
    }
  },

  // Ham nay dung de tang so lan nhap secret PIN cua mot ma QR xac thuc.
  // Nhan vao: qrId la ma QR can tang counter va options co the chua executor.
  // Tra ve: boolean cho biet lenh UPDATE co thanh cong hay khong.
  async incrementPinAttemptCount(qrId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        UPDATE qr_codes
        SET total_pin_attempts = total_pin_attempts + 1
        WHERE qr_id = ?
      `;
      const [result] = await executor.execute(query, [qrId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (incrementPinAttemptCount):", error);
      throw error;
    }
  },

  // Ham nay dung de chuyen QR sang trang thai ACTIVATED va dong thoi ghi nhan activated_at.
  // Nhan vao: qrId la ma QR can kich hoat va options co the chua executor.
  // Tra ve: boolean cho biet lenh UPDATE co thanh cong hay khong.
  async activateQrCode(qrId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        UPDATE qr_codes
        SET
          status = 'ACTIVATED',
          activated_at = COALESCE(activated_at, CURRENT_TIMESTAMP)
        WHERE qr_id = ?
      `;
      const [result] = await executor.execute(query, [qrId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (activateQrCode):", error);
      throw error;
    }
  },

  // Ham nay dung de lay danh sach QR cua mot batch theo thu tu tao de export tem hang loat.
  // Nhan vao: batchId la ma batch can tai va options co the chua executor.
  // Tra ve: mang QR rows chua public token va metadata scan.
  async listByBatchId(batchId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          qr_id,
          qr_public_token,
          source,
          status,
          effective_from,
          activated_at,
          expires_at,
          scan_limit,
          total_public_scans,
          total_pin_attempts,
          created_at
        FROM qr_codes
        WHERE batch_id = ?
        ORDER BY created_at ASC, qr_id ASC
      `;

      const [rows] = await executor.execute(query, [batchId]);
      return rows;
    } catch (error) {
      console.error("Model Error (listByBatchId):", error);
      throw error;
    }
  },
};

module.exports = qrCodeModel;
