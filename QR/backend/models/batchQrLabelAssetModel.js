const db = require("../config/database");

const getExecutor = (executor) => executor || db;

const batchQrLabelAssetModel = {
  // Ham nay dung de chen hang loat metadata anh QR cua cac tem vao DB.
  // Nhan vao: assetPayloads la mang asset row va options co the chua executor transaction.
  // Tra ve: so dong da chen.
  async bulkCreateAssets(assetPayloads = [], options = {}) {
    if (!Array.isArray(assetPayloads) || !assetPayloads.length) {
      return 0;
    }

    try {
      const executor = getExecutor(options.executor);
      const placeholders = assetPayloads.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
      const query = `
        INSERT INTO batch_qr_label_assets (
          asset_id,
          label_id,
          asset_type,
          file_name,
          file_format,
          storage_path,
          public_url,
          width_cm,
          height_cm
        )
        VALUES ${placeholders}
      `;

      const values = assetPayloads.flatMap((assetPayload) => [
        assetPayload.assetId,
        assetPayload.labelId,
        assetPayload.assetType,
        assetPayload.fileName,
        assetPayload.fileFormat,
        assetPayload.storagePath,
        assetPayload.publicUrl,
        assetPayload.widthCm,
        assetPayload.heightCm,
      ]);

      const [result] = await executor.execute(query, values);
      return result.affectedRows || 0;
    } catch (error) {
      console.error("Model Error (bulkCreateAssets):", error);
      throw error;
    }
  },

  // Ham nay dung de lay asset anh cua nhieu batch thong qua bang label de render UI/export.
  // Nhan vao: batchIds la mang ma batch can tra cuu.
  // Tra ve: mang asset rows kem thong tin label.
  async listByBatchIds(batchIds = [], options = {}) {
    if (!Array.isArray(batchIds) || !batchIds.length) {
      return [];
    }

    try {
      const executor = getExecutor(options.executor);
      const placeholders = batchIds.map(() => "?").join(", ");
      const query = `
        SELECT
          asset.asset_id,
          asset.label_id,
          asset.asset_type,
          asset.file_name,
          asset.file_format,
          asset.storage_path,
          asset.public_url,
          asset.width_cm,
          asset.height_cm,
          label.batch_id,
          label.sequence_no
        FROM batch_qr_label_assets AS asset
        INNER JOIN batch_qr_labels AS label
          ON label.label_id = asset.label_id
        WHERE label.batch_id IN (${placeholders})
        ORDER BY label.batch_id ASC, label.sequence_no ASC, asset.asset_type ASC
      `;

      const [rows] = await executor.execute(query, batchIds);
      return rows;
    } catch (error) {
      console.error("Model Error (listByBatchIds batchQrLabelAsset):", error);
      throw error;
    }
  },
};

module.exports = batchQrLabelAssetModel;
