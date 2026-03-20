const db = require("../config/database");

// Ham nay dung de chon executor phu hop cho query pictures, uu tien transaction neu co.
// Nhan vao: executor la connection/query executor tuy chon.
// Tra ve: executor se duoc dung khi thuc thi SQL.
const getExecutor = (executor) => executor || db;

const pictureModel = {
  // Ham nay dung de chen mot ban ghi anh QR scan moi vao bang pictures.
  // Nhan vao: picturePayload chua path anh goc va metadata xu ly, options co the chua executor.
  // Tra ve: boolean cho biet lenh INSERT co thanh cong hay khong.
  async createScanPicture(picturePayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        INSERT INTO pictures (
          picture_id,
          picture_group,
          capture_source,
          original_file_name,
          original_mime_type,
          original_storage_path,
          original_public_url,
          processed_file_name,
          processed_storage_path,
          processed_public_url,
          processing_status,
          processing_note
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await executor.execute(query, [
        picturePayload.pictureId,
        picturePayload.pictureGroup,
        picturePayload.captureSource,
        picturePayload.originalFileName,
        picturePayload.originalMimeType,
        picturePayload.originalStoragePath,
        picturePayload.originalPublicUrl,
        picturePayload.processedFileName,
        picturePayload.processedStoragePath,
        picturePayload.processedPublicUrl,
        picturePayload.processingStatus,
        picturePayload.processingNote,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (createScanPicture):", error);
      throw error;
    }
  },

  // Ham nay dung de danh dau mot anh dang duoc backend/Python bat dau xu ly.
  // Nhan vao: pictureId la record can claim, processingNote mo ta trang thai va options.
  // Tra ve: boolean cho biet record co duoc chuyen tu PENDING sang PROCESSING hay khong.
  async markPictureAsProcessing(pictureId, processingNote, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        UPDATE pictures
        SET
          processing_status = 'PROCESSING',
          processing_note = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE picture_id = ?
          AND processing_status = 'PENDING'
      `;

      const [result] = await executor.execute(query, [
        processingNote || "The Python QR processing worker is running.",
        pictureId,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (markPictureAsProcessing):", error);
      throw error;
    }
  },

  // Ham nay dung de cap nhat duong dan anh da xu ly khi thuat toan OpenCV hoan tat.
  // Nhan vao: pictureId la record can cap nhat, processedPayload chua thong tin file output va options.
  // Tra ve: boolean cho biet lenh UPDATE co thanh cong hay khong.
  async markPictureAsProcessed(pictureId, processedPayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        UPDATE pictures
        SET
          processed_file_name = ?,
          processed_storage_path = ?,
          processed_public_url = ?,
          processing_status = ?,
          processing_note = ?,
          processed_at = CURRENT_TIMESTAMP
        WHERE picture_id = ?
      `;

      const [result] = await executor.execute(query, [
        processedPayload.processedFileName,
        processedPayload.processedStoragePath,
        processedPayload.processedPublicUrl,
        processedPayload.processingStatus || "PROCESSED",
        processedPayload.processingNote || null,
        pictureId,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (markPictureAsProcessed):", error);
      throw error;
    }
  },

  // Ham nay dung de cap nhat trang thai FAILED cho anh scan khi buoc OpenCV xu ly bi loi.
  // Nhan vao: pictureId la record can danh dau loi, failureNote la mo ta nguyen nhan va options.
  // Tra ve: boolean cho biet lenh UPDATE co thanh cong hay khong.
  async markPictureAsFailed(pictureId, failureNote, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        UPDATE pictures
        SET
          processing_status = 'FAILED',
          processing_note = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE picture_id = ?
      `;

      const [result] = await executor.execute(query, [failureNote || null, pictureId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (markPictureAsFailed):", error);
      throw error;
    }
  },

  // Ham nay dung de lay thong tin mot anh QR scan theo pictureId de cac buoc xu ly sau dung lai.
  // Nhan vao: pictureId la ma ban ghi can tim, options co the chua executor.
  // Tra ve: ban ghi picture hoac null neu khong ton tai.
  async findById(pictureId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          picture_id,
          picture_group,
          capture_source,
          original_file_name,
          original_mime_type,
          original_storage_path,
          original_public_url,
          processed_file_name,
          processed_storage_path,
          processed_public_url,
          processing_status,
          processing_note,
          created_at,
          processed_at,
          updated_at
        FROM pictures
        WHERE picture_id = ?
        LIMIT 1
      `;

      const [rows] = await executor.execute(query, [pictureId]);
      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findById picture):", error);
      throw error;
    }
  },

  // Ham nay dung de lay danh sach anh QR scan dang cho OpenCV xu ly theo thu tu tao.
  // Nhan vao: limit la so ban ghi toi da can lay, options co the chua executor.
  // Tra ve: mang ban ghi pictures o trang thai PENDING de pipeline xu ly tiep.
  async findPendingScanPictures(limit = 50, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 50;
      const query = `
        SELECT
          picture_id,
          picture_group,
          capture_source,
          original_file_name,
          original_mime_type,
          original_storage_path,
          original_public_url,
          processed_file_name,
          processed_storage_path,
          processed_public_url,
          processing_status,
          processing_note,
          created_at,
          processed_at,
          updated_at
        FROM pictures
        WHERE picture_group = 'QR_SCAN'
          AND processing_status = 'PENDING'
        ORDER BY created_at ASC
        LIMIT ${safeLimit}
      `;

      const [rows] = await executor.execute(query);
      return rows;
    } catch (error) {
      console.error("Model Error (findPendingScanPictures):", error);
      throw error;
    }
  },
};

module.exports = pictureModel;
