const db = require("../config/database");

// Ham nay dung de chon executor phu hop cho query thong ke admin, uu tien transaction neu co.
// Nhan vao: executor la connection/query executor tuy chon.
// Tra ve: executor se duoc dung de thuc thi SQL.
const getExecutor = (executor) => executor || db;

const adminSystemModel = {
  // Ham nay dung de lay danh sach user co ban cho modal thong ke cua admin.
  // Nhan vao: options co the chua executor.
  // Tra ve: mang user da duoc noi voi accounts va sap xep theo moi nhat.
  async listUsers(options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          a.full_name,
          a.gender,
          a.status,
          a.last_login_at,
          a.created_at
        FROM users AS u
        INNER JOIN accounts AS a
          ON a.account_id = u.account_id
        ORDER BY a.created_at DESC, a.full_name ASC
      `;

      const [rows] = await executor.execute(query);
      return rows;
    } catch (error) {
      console.error("Model Error (listUsers):", error);
      throw error;
    }
  },

  // Ham nay dung de lay danh sach brand va thong tin co ban cho dashboard admin.
  // Nhan vao: options co the chua executor.
  // Tra ve: mang brand da noi voi accounts.
  async listBrands(options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          b.brand_name,
          a.full_name AS owner_name,
          b.tax_id,
          a.email,
          a.status,
          a.last_login_at,
          b.website,
          b.verification_status,
          b.verified,
          a.created_at
        FROM brands AS b
        INNER JOIN accounts AS a
          ON a.account_id = b.account_id
        ORDER BY a.created_at DESC, b.brand_name ASC
      `;

      const [rows] = await executor.execute(query);
      return rows;
    } catch (error) {
      console.error("Model Error (listBrands):", error);
      throw error;
    }
  },

  // Ham nay dung de lay danh sach admin co ban cho khu vuc he thong.
  // Nhan vao: options co the chua executor.
  // Tra ve: mang admin dang ton tai trong bang accounts.
  async listAdmins(options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          full_name,
          gender,
          status,
          last_login_at,
          created_at
        FROM accounts
        WHERE role = 'admin'
        ORDER BY created_at DESC, full_name ASC
      `;

      const [rows] = await executor.execute(query);
      return rows;
    } catch (error) {
      console.error("Model Error (listAdmins):", error);
      throw error;
    }
  },
};

module.exports = adminSystemModel;
