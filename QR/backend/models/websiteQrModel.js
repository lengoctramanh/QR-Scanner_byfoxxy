const db = require("../config/database");

// Ham nay dung de chon executor phu hop cho query website QR, uu tien transaction neu co.
// Nhan vao: executor la connection/query executor tuy chon.
// Tra ve: executor se duoc dung cho cac truy van model nay.
const getExecutor = (executor) => executor || db;

const WEBSITE_QR_SELECT_FIELDS = `
  config_id,
  website_url,
  compact_url,
  change_number,
  qr_file_name,
  qr_storage_path,
  qr_public_url,
  created_by_admin_id,
  created_at
`;

const websiteQrModel = {
  // Ham nay dung de lay ban ghi QR URL moi nhat dang duoc xem la cau hinh hien tai.
  // Nhan vao: options co the chua executor de dung chung transaction.
  // Tra ve: dong du lieu moi nhat hoac null neu he thong chua duoc cau hinh.
  async findLatest(options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT ${WEBSITE_QR_SELECT_FIELDS}
        FROM website_qr_configs
        ORDER BY change_number DESC
        LIMIT 1
      `;
      const [rows] = await executor.execute(query);
      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findLatestWebsiteQr):", error);
      throw error;
    }
  },

  // Ham nay dung de lay lich su cac phien ban QR URL gan nhat de admin theo doi.
  // Nhan vao: limit la so dong toi da va options co the chua executor.
  // Tra ve: mang cac ban ghi duoc sap xep giam dan theo change_number.
  async listHistory(limit = 10, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
      const query = `
        SELECT ${WEBSITE_QR_SELECT_FIELDS}
        FROM website_qr_configs
        ORDER BY change_number DESC
        LIMIT ${safeLimit}
      `;
      const [rows] = await executor.execute(query);
      return rows;
    } catch (error) {
      console.error("Model Error (listWebsiteQrHistory):", error);
      throw error;
    }
  },

  // Ham nay dung de tinh so lan thay doi tiep theo truoc khi chen phien ban moi.
  // Nhan vao: options co the chua executor cho transaction hien tai.
  // Tra ve: gia tri int bat dau tu 1.
  async getNextChangeNumber(options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT COALESCE(MAX(change_number), 0) + 1 AS next_change_number
        FROM website_qr_configs
      `;
      const [rows] = await executor.execute(query);
      return rows[0]?.next_change_number || 1;
    } catch (error) {
      console.error("Model Error (getNextWebsiteQrChangeNumber):", error);
      throw error;
    }
  },

  // Ham nay dung de luu mot phien ban website QR moi vao DB sau khi file QR da duoc sinh.
  // Nhan vao: configPayload chua du lieu can insert va options co the chua executor.
  // Tra ve: boolean cho biet thao tac INSERT co thanh cong hay khong.
  async createConfig(configPayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        INSERT INTO website_qr_configs (
          config_id,
          website_url,
          compact_url,
          change_number,
          qr_file_name,
          qr_storage_path,
          qr_public_url,
          created_by_admin_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await executor.execute(query, [
        configPayload.configId,
        configPayload.websiteUrl,
        configPayload.compactUrl,
        configPayload.changeNumber,
        configPayload.qrFileName,
        configPayload.qrStoragePath,
        configPayload.qrPublicUrl,
        configPayload.createdByAdminId,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (createWebsiteQrConfig):", error);
      throw error;
    }
  },
};

module.exports = websiteQrModel;
