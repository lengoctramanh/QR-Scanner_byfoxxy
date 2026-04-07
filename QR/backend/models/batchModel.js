const db = require("../config/database");

// Ham nay dung de chon executor phu hop cho query lo hang, uu tien transaction neu co.
// Nhan vao: executor la connection/query executor tuy chon.
// Tra ve: executor duoc dung trong cac truy van batch.
const getExecutor = (executor) => executor || db;

const batchModel = {
  // Ham nay dung de tao mot lo hang moi cho san pham de gan metadata batch va QR 1 xac thuc.
  // Nhan vao: batchPayload chua du lieu batch moi va options co the chua executor.
  // Tra ve: boolean cho biet thao tac INSERT co thanh cong hay khong.
  async createBatch(batchPayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        INSERT INTO batches (
          batch_id,
          product_id,
          batch_code,
          manufacture_date,
          expiry_date,
          quantity
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [result] = await executor.execute(query, [
        batchPayload.batchId,
        batchPayload.productId,
        batchPayload.batchCode,
        batchPayload.manufactureDate,
        batchPayload.expiryDate,
        batchPayload.quantity,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (createBatch):", error);
      throw error;
    }
  },

  // Ham nay dung de lay thong tin batch kem product/brand de export va kiem tra quyen so huu.
  // Nhan vao: batchId la ma batch can tra cuu va options co the chua executor.
  // Tra ve: dong du lieu tong hop hoac null neu batch khong ton tai.
  async findBatchSummaryById(batchId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          bt.batch_id,
          bt.product_id,
          bt.batch_code,
          bt.manufacture_date,
          bt.expiry_date,
          bt.quantity,
          p.product_name,
          p.description,
          p.general_info_url,
          p.manufacturer_name,
          p.origin_country,
          p.quality_certifications,
          b.brand_id,
          b.brand_name
        FROM batches AS bt
        INNER JOIN products AS p
          ON p.product_id = bt.product_id
        INNER JOIN brands AS b
          ON b.brand_id = p.brand_id
        WHERE bt.batch_id = ?
        LIMIT 1
      `;

      const [rows] = await executor.execute(query, [batchId]);
      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findBatchSummaryById):", error);
      throw error;
    }
  },

  // Ham nay dung de lay toan bo catalog va cac lo hang cua mot brand de render Manage Products.
  // Nhan vao: brandId la ma thuong hieu dang dang nhap.
  // Tra ve: mang rows tong hop product-brand-batch va thong ke QR theo batch.
  async listCatalogBatchesByBrandId(brandId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          p.product_id,
          p.product_name,
          p.description,
          p.general_info_url,
          p.manufacturer_name,
          p.origin_country,
          p.quality_certifications,
          p.created_at AS product_created_at,
          b.brand_id,
          b.brand_name,
          bt.batch_id,
          bt.batch_code,
          bt.manufacture_date,
          bt.expiry_date,
          bt.quantity,
          bt.created_at AS batch_created_at,
          COALESCE(qr_stats.total_public_scans, 0) AS total_public_scans,
          COALESCE(qr_stats.total_pin_attempts, 0) AS total_pin_attempts,
          COALESCE(qr_stats.scan_limit, 0) AS scan_limit
        FROM products AS p
        INNER JOIN brands AS b
          ON b.brand_id = p.brand_id
        LEFT JOIN batches AS bt
          ON bt.product_id = p.product_id
        LEFT JOIN (
          SELECT
            batch_id,
            SUM(total_public_scans) AS total_public_scans,
            SUM(total_pin_attempts) AS total_pin_attempts,
            MAX(scan_limit) AS scan_limit
          FROM qr_codes
          GROUP BY batch_id
        ) AS qr_stats
          ON qr_stats.batch_id = bt.batch_id
        WHERE p.brand_id = ?
        ORDER BY p.created_at DESC, bt.created_at DESC, bt.batch_code DESC
      `;

      const [rows] = await executor.execute(query, [brandId]);
      return rows;
    } catch (error) {
      console.error("Model Error (listCatalogBatchesByBrandId):", error);
      throw error;
    }
  },
};

module.exports = batchModel;
