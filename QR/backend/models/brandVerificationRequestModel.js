const db = require("../config/database");

const getExecutor = (executor) => executor || db;

const brandVerificationRequestModel = {
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
