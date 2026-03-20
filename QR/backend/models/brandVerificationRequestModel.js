const db = require("../config/database");

// Ham nay dung de chon executor phu hop cho query verification, uu tien transaction neu co.
// Nhan vao: executor la connection/query executor tuy chon.
// Tra ve: executor se duoc dung khi thuc thi SQL.
const getExecutor = (executor) => executor || db;

const brandVerificationRequestModel = {
  // Ham nay dung de tao log submission dau tien cho mot yeu cau xac minh brand.
  // Nhan vao: logPayload chua du lieu verification, options co the chua executor.
  // Tra ve: boolean cho biet ban ghi co duoc them vao DB hay khong.
  async createInitialSubmission(logPayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        INSERT INTO brand_verification_requests (
          verification_id,
          brand_id,
          action,
          performed_by_id,
          performed_role,
          note,
          attachment_urls
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await executor.execute(query, [
        logPayload.verificationId,
        logPayload.brandId,
        logPayload.action,
        logPayload.performedById,
        logPayload.performedRole,
        logPayload.note,
        logPayload.attachmentUrls,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (createInitialSubmission):", error);
      throw error;
    }
  },
};

module.exports = brandVerificationRequestModel;
