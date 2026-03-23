const db = require("../config/database");

const getExecutor = (executor) => executor || db;

const batchQrLabelModel = {
  // Ham nay dung de chen hang loat tem/nhan QR cua mot batch vao DB.
  // Nhan vao: labelPayloads la mang row va options co the chua executor transaction.
  // Tra ve: so dong duoc chen thanh cong.
  async bulkCreateLabels(labelPayloads = [], options = {}) {
    if (!Array.isArray(labelPayloads) || !labelPayloads.length) {
      return 0;
    }

    try {
      const executor = getExecutor(options.executor);
      const placeholders = labelPayloads.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
      const query = `
        INSERT INTO batch_qr_labels (
          label_id,
          batch_id,
          qr_id,
          sequence_no,
          label_code,
          storage_root_path,
          width_cm,
          height_cm,
          qr_size_cm
        )
        VALUES ${placeholders}
      `;

      const values = labelPayloads.flatMap((labelPayload) => [
        labelPayload.labelId,
        labelPayload.batchId,
        labelPayload.qrId,
        labelPayload.sequenceNo,
        labelPayload.labelCode,
        labelPayload.storageRootPath,
        labelPayload.widthCm,
        labelPayload.heightCm,
        labelPayload.qrSizeCm,
      ]);

      const [result] = await executor.execute(query, values);
      return result.affectedRows || 0;
    } catch (error) {
      console.error("Model Error (bulkCreateLabels):", error);
      throw error;
    }
  },

  // Ham nay dung de lay toan bo tem cua nhieu batch de render catalog/chi tiet lo.
  // Nhan vao: batchIds la mang ma batch can tra cuu.
  // Tra ve: mang label rows da sap xep theo batch va sequence.
  async listByBatchIds(batchIds = [], options = {}) {
    if (!Array.isArray(batchIds) || !batchIds.length) {
      return [];
    }

    try {
      const executor = getExecutor(options.executor);
      const placeholders = batchIds.map(() => "?").join(", ");
      const query = `
        SELECT
          label_id,
          batch_id,
          qr_id,
          sequence_no,
          label_code,
          storage_root_path,
          width_cm,
          height_cm,
          qr_size_cm,
          created_at
        FROM batch_qr_labels
        WHERE batch_id IN (${placeholders})
        ORDER BY batch_id ASC, sequence_no ASC
      `;

      const [rows] = await executor.execute(query, batchIds);
      return rows;
    } catch (error) {
      console.error("Model Error (listByBatchIds batchQrLabel):", error);
      throw error;
    }
  },
};

module.exports = batchQrLabelModel;
