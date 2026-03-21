const db = require("../config/database");

// Ham nay dung de chon executor phu hop cho query request, uu tien transaction neu co.
// Nhan vao: executor la connection/query executor tuy chon.
// Tra ve: executor se duoc dung de thuc thi SQL.
const getExecutor = (executor) => executor || db;

const ACTIVE_REQUEST_STATUSES = ["PENDING", "UNDER_REVIEW"];

const brandRegistrationRequestModel = {
  // Ham nay dung de kiem tra xung dot giua request moi va cac request brand dang con hieu luc.
  // Nhan vao: conflictPayload chua email, phone, taxId; options co the chua executor.
  // Tra ve: dong request xung dot dau tien hoac null neu khong co xung dot trong DB.
  async checkPendingConflict(conflictPayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          request_id,
          email,
          phone,
          tax_id,
          request_status
        FROM brand_registration_requests
        WHERE request_status IN (?, ?)
          AND (
            email = ?
            OR (? IS NOT NULL AND phone = ?)
            OR tax_id = ?
          )
        LIMIT 1
      `;

      const [rows] = await executor.execute(query, [
        ACTIVE_REQUEST_STATUSES[0],
        ACTIVE_REQUEST_STATUSES[1],
        conflictPayload.email,
        conflictPayload.phone,
        conflictPayload.phone,
        conflictPayload.taxId,
      ]);

      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (checkPendingConflict):", error);
      throw error;
    }
  },

  // Ham nay dung de chen mot yeu cau dang ky brand moi vao bang brand_registration_requests.
  // Nhan vao: requestPayload chua toan bo du lieu dang ky, options co the chua executor.
  // Tra ve: boolean cho biet lenh INSERT co thanh cong hay khong.
  async createRequest(requestPayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        INSERT INTO brand_registration_requests (
          request_id,
          reserved_account_id,
          reserved_brand_id,
          full_name,
          dob,
          gender,
          email,
          phone,
          password_hash,
          brand_name,
          tax_id,
          website,
          industry,
          product_categories,
          attachment_urls,
          request_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await executor.execute(query, [
        requestPayload.requestId,
        requestPayload.reservedAccountId,
        requestPayload.reservedBrandId,
        requestPayload.fullName,
        requestPayload.dob,
        requestPayload.gender,
        requestPayload.email,
        requestPayload.phone,
        requestPayload.passwordHash,
        requestPayload.brandName,
        requestPayload.taxId,
        requestPayload.website,
        requestPayload.industry,
        requestPayload.productCategories,
        requestPayload.attachmentUrls,
        requestPayload.requestStatus,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (createRequest):", error);
      throw error;
    }
  },

  // Ham nay dung de lay chi tiet mot yeu cau dang ky brand theo requestId.
  // Nhan vao: requestId la ma yeu cau, options co the chua executor.
  // Tra ve: ban ghi request hoac null neu khong tim thay trong DB.
  async findById(requestId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          request_id,
          reserved_account_id,
          reserved_brand_id,
          full_name,
          dob,
          gender,
          email,
          phone,
          password_hash,
          brand_name,
          tax_id,
          website,
          industry,
          product_categories,
          attachment_urls,
          request_status,
          admin_note,
          reviewed_by_admin_id,
          reviewed_at,
          created_at
        FROM brand_registration_requests
        WHERE request_id = ?
        LIMIT 1
      `;

      const [rows] = await executor.execute(query, [requestId]);
      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findById):", error);
      throw error;
    }
  },

  // Ham nay dung de lay danh sach request brand, co the loc theo status.
  // Nhan vao: filters chua status tuy chon va options co the chua executor.
  // Tra ve: mang ban ghi request lay tu DB.
  async listRequests(filters = {}, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const normalizedStatus = filters.status ? String(filters.status).trim().toUpperCase() : null;

      if (normalizedStatus) {
        const query = `
          SELECT
            request_id,
            full_name,
            email,
            phone,
            brand_name,
            tax_id,
            website,
            industry,
            request_status,
            admin_note,
            reviewed_by_admin_id,
            reviewed_at,
            created_at
          FROM brand_registration_requests
          WHERE request_status = ?
          ORDER BY
            CASE request_status
              WHEN 'PENDING' THEN 0
              WHEN 'UNDER_REVIEW' THEN 1
              WHEN 'REJECTED' THEN 2
              WHEN 'ACCOUNT_CREATED' THEN 3
              ELSE 9
            END,
            created_at DESC
        `;

        const [rows] = await executor.execute(query, [normalizedStatus]);
        return rows;
      }

      const query = `
        SELECT
          request_id,
          full_name,
          email,
          phone,
          brand_name,
          tax_id,
          website,
          industry,
          request_status,
          admin_note,
          reviewed_by_admin_id,
          reviewed_at,
          created_at
        FROM brand_registration_requests
        ORDER BY
          CASE request_status
            WHEN 'PENDING' THEN 0
            WHEN 'UNDER_REVIEW' THEN 1
            WHEN 'REJECTED' THEN 2
            WHEN 'ACCOUNT_CREATED' THEN 3
            ELSE 9
          END,
          created_at DESC
      `;

      const [rows] = await executor.execute(query);
      return rows;
    } catch (error) {
      console.error("Model Error (listRequests):", error);
      throw error;
    }
  },

  // Ham nay dung de cap nhat trang thai review cua mot request brand.
  // Nhan vao: updatePayload chua requestStatus, adminNote, reviewedByAdminId, requestId; options co the chua executor.
  // Tra ve: boolean cho biet lenh UPDATE co thanh cong hay khong.
  async updateStatus(updatePayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        UPDATE brand_registration_requests
        SET
          request_status = ?,
          admin_note = ?,
          reviewed_by_admin_id = ?,
          reviewed_at = CURRENT_TIMESTAMP
        WHERE request_id = ?
      `;

      const [result] = await executor.execute(query, [
        updatePayload.requestStatus,
        updatePayload.adminNote,
        updatePayload.reviewedByAdminId,
        updatePayload.requestId,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (updateStatus):", error);
      throw error;
    }
  },
};

module.exports = brandRegistrationRequestModel;
