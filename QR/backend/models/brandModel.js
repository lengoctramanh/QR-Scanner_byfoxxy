const db = require("../config/database");

// Ham nay dung de chon executor phu hop cho query brand, uu tien transaction neu co.
// Nhan vao: executor la connection/query executor tuy chon.
// Tra ve: executor dung de thuc thi SQL.
const getExecutor = (executor) => executor || db;

const brandModel = {
  // Ham nay dung de kiem tra tax ID da duoc dung cho brand nao trong DB hay chua.
  // Nhan vao: taxId la ma so thue can kiem tra, options co the chua executor.
  // Tra ve: boolean cho biet tax ID co trung hay khong.
  async checkTaxIdExists(taxId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = "SELECT brand_id FROM brands WHERE tax_id = ? LIMIT 1";
      const [rows] = await executor.execute(query, [taxId]);
      return rows.length > 0;
    } catch (error) {
      console.error("Model Error (checkTaxIdExists):", error);
      throw error;
    }
  },

  // Ham nay dung de tao ho so brand moi trong bang brands.
  // Nhan vao: brandPayload chua du lieu brand, options co the chua executor.
  // Tra ve: boolean cho biet lenh INSERT co thanh cong hay khong.
  async createBrandProfile(brandPayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        INSERT INTO brands (
          brand_id,
          account_id,
          brand_name,
          tax_id,
          website,
          address,
          industry,
          product_categories,
          verified
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await executor.execute(query, [
        brandPayload.brandId,
        brandPayload.accountId,
        brandPayload.brandName,
        brandPayload.taxId,
        brandPayload.website,
        brandPayload.address || null,
        brandPayload.industry,
        brandPayload.productCategories,
        brandPayload.verified ?? false,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (createBrandProfile):", error);
      throw error;
    }
  },

  // Ham nay dung de lay ho so brand theo accountId de phuc vu profile dashboard cua brand.
  // Nhan vao: accountId la ma tai khoan brand va options co the chua executor.
  // Tra ve: ban ghi brand hoac null neu tai khoan chua co ho so brand trong DB.
  async findByAccountId(accountId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          brand_id,
          account_id,
          brand_name,
          logo_url,
          tax_id,
          website,
          address,
          industry,
          product_categories,
          verified
        FROM brands
        WHERE account_id = ?
        LIMIT 1
      `;

      const [rows] = await executor.execute(query, [accountId]);
      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findBrandByAccountId):", error);
      throw error;
    }
  },

  // Ham nay dung de tim thuong hieu theo ma so thue de kiem tra trung khi cap nhat.
  // Nhan vao: taxId la ma so thue can tim, options co the chua executor.
  // Tra ve: ban ghi toi gian chua brand_id hoac null neu khong tim thay.
  async findByTaxId(taxId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT brand_id, account_id, tax_id
        FROM brands
        WHERE tax_id = ?
        LIMIT 1
      `;
      const [rows] = await executor.execute(query, [taxId]);
      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findByTaxId):", error);
      throw error;
    }
  },

  // Ham nay dung de cap nhat thong tin business profile cua thuong hieu.
  // Nhan vao: brandPayload chua cac field cho phep cap nhat va options co the chua executor.
  // Tra ve: boolean cho biet lenh UPDATE co tac dong len ban ghi hay khong.
  async updateBrandProfile(brandPayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        UPDATE brands
        SET
          brand_name = ?,
          logo_url = ?,
          tax_id = ?,
          website = ?,
          address = ?
        WHERE brand_id = ?
      `;
      const [result] = await executor.execute(query, [
        brandPayload.brandName,
        brandPayload.logoUrl,
        brandPayload.taxId,
        brandPayload.website,
        brandPayload.address,
        brandPayload.brandId,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (updateBrandProfile):", error);
      throw error;
    }
  },
};

module.exports = brandModel;
