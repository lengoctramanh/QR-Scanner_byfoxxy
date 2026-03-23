const db = require("../config/database");

// Ham nay dung de chon executor phu hop cho query guest token, uu tien transaction neu co.
// Nhan vao: executor transaction/query tuy chon.
// Tra ve: executor se duoc dung de thuc thi SQL.
const getExecutor = (executor) => executor || db;

const GUEST_SCAN_TOKEN_FIELDS = `
  guest_token_id,
  token_hash,
  qr_id,
  batch_id,
  source_log_id,
  scan_verdict,
  response_code,
  response_message,
  result_snapshot_json,
  claim_url,
  qr_file_name,
  qr_storage_path,
  qr_public_url,
  claimed_by_user_id,
  claimed_at,
  created_at,
  last_resolved_at
`;

const guestScanTokenModel = {
  // Ham nay dung de luu mot token guest moi sau khi khach vang lai quet ma hop le hoac can luu ket qua.
  // Nhan vao: tokenPayload chua du lieu snapshot, duong dan QR va mapping entity.
  // Tra ve: boolean cho biet ban ghi co duoc tao thanh cong hay khong.
  async createToken(tokenPayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        INSERT INTO guest_scan_tokens (
          guest_token_id,
          token_hash,
          qr_id,
          batch_id,
          source_log_id,
          scan_verdict,
          response_code,
          response_message,
          result_snapshot_json,
          claim_url,
          qr_file_name,
          qr_storage_path,
          qr_public_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await executor.execute(query, [
        tokenPayload.guestTokenId,
        tokenPayload.tokenHash,
        tokenPayload.qrId ?? null,
        tokenPayload.batchId ?? null,
        tokenPayload.sourceLogId ?? null,
        tokenPayload.scanVerdict,
        tokenPayload.responseCode ?? null,
        tokenPayload.responseMessage ?? null,
        tokenPayload.resultSnapshotJson,
        tokenPayload.claimUrl,
        tokenPayload.qrFileName,
        tokenPayload.qrStoragePath,
        tokenPayload.qrPublicUrl,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (createGuestScanToken):", error);
      throw error;
    }
  },

  // Ham nay dung de tim guest token bang hash raw token do QR guest encode.
  // Nhan vao: tokenHash la SHA-256 cua token raw va options co the chua executor.
  // Tra ve: ban ghi token hoac null neu khong tim thay.
  async findByTokenHash(tokenHash, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const lockingClause = options.forUpdate ? " FOR UPDATE" : "";
      const query = `
        SELECT ${GUEST_SCAN_TOKEN_FIELDS}
        FROM guest_scan_tokens
        WHERE token_hash = ?
        LIMIT 1${lockingClause}
      `;

      const [rows] = await executor.execute(query, [tokenHash]);
      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findGuestScanTokenByHash):", error);
      throw error;
    }
  },

  // Ham nay dung de danh dau guest token da duoc user claim hoac vua duoc mo lai.
  // Nhan vao: guestTokenId la ban ghi can cap nhat va updatePayload chua thong tin claim.
  // Tra ve: boolean cho biet thao tac UPDATE co tac dong hay khong.
  async touchToken(guestTokenId, updatePayload = {}, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        UPDATE guest_scan_tokens
        SET
          claimed_by_user_id = COALESCE(?, claimed_by_user_id),
          claimed_at = CASE
            WHEN ? IS NOT NULL AND claimed_at IS NULL THEN CURRENT_TIMESTAMP
            ELSE claimed_at
          END,
          last_resolved_at = CURRENT_TIMESTAMP
        WHERE guest_token_id = ?
      `;

      const [result] = await executor.execute(query, [
        updatePayload.claimedByUserId ?? null,
        updatePayload.claimedByUserId ?? null,
        guestTokenId,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (touchGuestScanToken):", error);
      throw error;
    }
  },
};

module.exports = guestScanTokenModel;
