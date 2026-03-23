const db = require("../config/database");

// Ham nay dung de chon executor phu hop cho query san pham, uu tien transaction neu co.
// Nhan vao: executor la connection/query executor tuy chon.
// Tra ve: executor duoc dung de thuc thi cac truy van san pham.
const getExecutor = (executor) => executor || db;

const productModel = {
  // Ham nay dung de tao mot san pham moi cho brand sau khi validate du lieu.
  // Nhan vao: productPayload chua metadata san pham va options co the chua executor.
  // Tra ve: boolean cho biet lenh INSERT co thanh cong hay khong.
  async createProduct(productPayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        INSERT INTO products (
          product_id,
          brand_id,
          product_name,
          description,
          image_url,
          general_info_url,
          manufacturer_name,
          origin_country,
          quality_certifications
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await executor.execute(query, [
        productPayload.productId,
        productPayload.brandId,
        productPayload.productName,
        productPayload.description,
        productPayload.imageUrl,
        productPayload.generalInfoUrl,
        productPayload.manufacturerName,
        productPayload.originCountry,
        productPayload.qualityCertifications,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (createProduct):", error);
      throw error;
    }
  },

  // Ham nay dung de lay danh sach san pham cua mot brand kem batch thong tin moi nhat.
  // Nhan vao: brandId la ma thuong hieu va options co the chua executor.
  // Tra ve: mang dong du lieu tong hop de dashboard brand hien thi.
  async listProductsByBrandId(brandId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          p.product_id,
          p.product_name,
          p.description,
          p.image_url,
          p.general_info_url,
          p.manufacturer_name,
          p.origin_country,
          p.quality_certifications,
          p.created_at,
          p.updated_at,
          b.brand_id,
          b.brand_name,
          bt.batch_id,
          bt.batch_code,
          bt.manufacture_date,
          bt.expiry_date,
          bt.quantity,
          qr.qr_id,
          qr.qr_public_token,
          qr.status AS qr_status,
          qr.scan_limit,
          qr.total_public_scans,
          qr.total_pin_attempts
        FROM products AS p
        INNER JOIN brands AS b
          ON b.brand_id = p.brand_id
        LEFT JOIN batches AS bt
          ON bt.batch_id = (
            SELECT newest_batch.batch_id
            FROM batches AS newest_batch
            WHERE newest_batch.product_id = p.product_id
            ORDER BY newest_batch.created_at DESC
            LIMIT 1
          )
        LEFT JOIN qr_codes AS qr
          ON qr.qr_id = (
            SELECT newest_qr.qr_id
            FROM qr_codes AS newest_qr
            WHERE newest_qr.product_id = p.product_id
            ORDER BY newest_qr.created_at DESC
            LIMIT 1
          )
        WHERE p.brand_id = ?
        ORDER BY p.created_at DESC
      `;

      const [rows] = await executor.execute(query, [brandId]);
      return rows;
    } catch (error) {
      console.error("Model Error (listProductsByBrandId):", error);
      throw error;
    }
  },
};

module.exports = productModel;
