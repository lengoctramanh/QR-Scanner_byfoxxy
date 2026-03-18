const db = require("../config/database");

const getExecutor = (executor) => executor || db;

const brandModel = {
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
          industry,
          product_categories,
          verified
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await executor.execute(query, [
        brandPayload.brandId,
        brandPayload.accountId,
        brandPayload.brandName,
        brandPayload.taxId,
        brandPayload.website,
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
};

module.exports = brandModel;
