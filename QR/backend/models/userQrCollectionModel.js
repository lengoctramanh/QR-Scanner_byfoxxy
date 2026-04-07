const db = require("../config/database");

// Ham nay dung de chon executor phu hop cho query bo suu tap QR cua user.
// Nhan vao: executor transaction/query tuy chon.
// Tra ve: executor duoc dung de thuc thi SQL.
const getExecutor = (executor) => executor || db;

const userQrCollectionModel = {
  // Ham nay dung de tim user dang so huu mot ma QR cu the de chan viec bind trung.
  // Nhan vao: qrId la ma QR can kiem tra va options co the chua executor/forUpdate.
  // Tra ve: ban ghi so huu hien tai hoac null neu chua co ai bind.
  async findOwnerByQrId(qrId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const lockingClause = options.forUpdate ? " FOR UPDATE" : "";
      const query = `
        SELECT
          collection_id,
          user_id,
          qr_id,
          bound_at,
          is_deleted_by_user
        FROM user_qr_collections
        WHERE qr_id = ?
        LIMIT 1${lockingClause}
      `;

      const [rows] = await executor.execute(query, [qrId]);
      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findUserQrCollectionOwnerByQrId):", error);
      throw error;
    }
  },

  // Ham nay dung de them QR da xac thuc vao bo suu tap cua user ma khong tao trung lap.
  // Nhan vao: collectionPayload chua collectionId, userId, qrId va ghi chu tuy chon.
  // Tra ve: boolean cho biet co ban ghi moi duoc tao hay khong.
  async addCollection(collectionPayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        INSERT IGNORE INTO user_qr_collections (
          collection_id,
          user_id,
          qr_id,
          nickname,
          personal_note
        )
        VALUES (?, ?, ?, ?, ?)
      `;

      const [result] = await executor.execute(query, [
        collectionPayload.collectionId,
        collectionPayload.userId,
        collectionPayload.qrId,
        collectionPayload.nickname ?? null,
        collectionPayload.personalNote ?? null,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (addUserQrCollection):", error);
      throw error;
    }
  },
};

module.exports = userQrCollectionModel;
