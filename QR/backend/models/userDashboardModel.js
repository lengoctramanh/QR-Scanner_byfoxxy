const db = require("../config/database");

// Ham nay dung de chon executor phu hop cho query dashboard cua user.
// Nhan vao: executor transaction/query tuy chon.
// Tra ve: executor se duoc dung de thuc thi SQL.
const getExecutor = (executor) => executor || db;

const PRODUCT_DETAIL_FIELDS = `
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
`;

const userDashboardModel = {
  // Ham nay dung de lay danh sach ma dang so huu cua user cho tab Active Codes.
  // Nhan vao: userId la ma user da duoc resolve tu account session.
  // Tra ve: mang dong du lieu tong hop gom collection, QR va metadata san pham.
  async listActiveCollectionsByUserId(userId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          c.collection_id,
          c.user_id,
          c.qr_id,
          c.bound_at,
          c.nickname,
          c.personal_note,
          q.qr_public_token,
          q.status AS qr_status,
          q.activated_at,
          q.expires_at,
          q.total_public_scans,
          q.total_pin_attempts,
          ${PRODUCT_DETAIL_FIELDS}
        FROM user_qr_collections AS c
        INNER JOIN qr_codes AS q
          ON q.qr_id = c.qr_id
        INNER JOIN batches AS bt
          ON bt.batch_id = q.batch_id
        INNER JOIN products AS p
          ON p.product_id = q.product_id
        INNER JOIN brands AS b
          ON b.brand_id = p.brand_id
        WHERE c.user_id = ?
          AND c.is_deleted_by_user = FALSE
        ORDER BY c.bound_at DESC
      `;

      const [rows] = await executor.execute(query, [userId]);
      return rows;
    } catch (error) {
      console.error("Model Error (listActiveCollectionsByUserId):", error);
      throw error;
    }
  },

  // Ham nay dung de lay lich su scan ca nhan cua user kem QR/product/batch de render tab History.
  // Nhan vao: userId la ma user dang xem dashboard.
  // Tra ve: mang dong du lieu tong hop theo thu tu moi nhat den cu nhat.
  async listScanHistoryByUserId(userId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          h.user_history_id,
          h.user_id,
          l.log_id,
          l.qr_public_token_input,
          l.qr_id,
          l.batch_id AS log_batch_id,
          l.scan_type,
          l.scan_result,
          l.location,
          l.device_info,
          l.ip_address,
          l.scanned_at,
          q.qr_public_token,
          q.status AS qr_status,
          q.activated_at,
          q.expires_at,
          q.total_public_scans,
          q.total_pin_attempts,
          ${PRODUCT_DETAIL_FIELDS}
        FROM user_scan_history AS h
        INNER JOIN scan_global_logs AS l
          ON l.log_id = h.log_id
        LEFT JOIN qr_codes AS q
          ON q.qr_id = l.qr_id
        LEFT JOIN batches AS bt
          ON bt.batch_id = COALESCE(l.batch_id, q.batch_id)
        LEFT JOIN products AS p
          ON p.product_id = COALESCE(q.product_id, bt.product_id)
        LEFT JOIN brands AS b
          ON b.brand_id = p.brand_id
        WHERE h.user_id = ?
          AND h.is_deleted_by_user = FALSE
        ORDER BY l.scanned_at DESC
      `;

      const [rows] = await executor.execute(query, [userId]);
      return rows;
    } catch (error) {
      console.error("Model Error (listScanHistoryByUserId):", error);
      throw error;
    }
  },
};

module.exports = userDashboardModel;
