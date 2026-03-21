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
};

module.exports = qrCodeModel;
