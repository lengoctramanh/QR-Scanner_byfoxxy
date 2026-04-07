const db = require("../config/database");

// Ham nay dung de chon executor phu hop cho query, uu tien transaction neu duoc truyen vao.
// Nhan vao: executor la connection/query executor tuy chon.
// Tra ve: executor duoc su dung de thuc thi SQL.
const getExecutor = (executor) => executor || db;

const accountModel = {
  // Ham nay dung de kiem tra email hoac so dien thoai da ton tai trong bang accounts hay chua.
  // Nhan vao: emailOrPhone la gia tri can doi chieu, options co the chua executor.
  // Tra ve: boolean cho biet co tai khoan phu hop trong DB hay khong.
  async checkExist(emailOrPhone, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = "SELECT account_id FROM accounts WHERE email = ? OR phone = ? LIMIT 1";
      const [rows] = await executor.execute(query, [emailOrPhone, emailOrPhone]);
      return rows.length > 0;
    } catch (error) {
      console.error("Model Error (checkExist):", error);
      throw error;
    }
  },

  // Ham nay dung de tim tai khoan theo email hoac so dien thoai de phuc vu dang nhap.
  // Nhan vao: identifier la email/phone da chuan hoa, options co the chua executor.
  // Tra ve: mot dong du lieu account kem thong tin brand lien quan, hoac null neu khong tim thay.
  async findByIdentifier(identifier, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          a.account_id,
          a.full_name,
          a.email,
          a.phone,
          a.password_hash,
          a.role,
          a.status,
          a.avatar_url,
          a.last_login_at,
          b.brand_id,
          b.brand_name,
          b.verified,
          NULL AS verification_status
        FROM accounts AS a
        LEFT JOIN brands AS b
          ON b.account_id = a.account_id
        WHERE a.email = ? OR a.phone = ?
        LIMIT 1
      `;
      const [rows] = await executor.execute(query, [identifier, identifier]);
      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findByIdentifier):", error);
      throw error;
    }
  },

  // Ham nay dung de lay du lieu tai khoan can thiet cho luong quen mat khau.
  // Nhan vao: identifier la email/phone da chuan hoa, options co the chua executor.
  // Tra ve: mot ban ghi account kem OTP/reset token, hoac null neu khong tim thay.
  async findPasswordResetAccountByIdentifier(identifier, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          account_id,
          full_name,
          email,
          phone,
          role,
          status,
          reset_otp_hash,
          otp_expiry,
          reset_token_hash,
          reset_token_expiry
        FROM accounts
        WHERE email = ? OR phone = ?
        LIMIT 1
      `;
      const [rows] = await executor.execute(query, [identifier, identifier]);
      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findPasswordResetAccountByIdentifier):", error);
      throw error;
    }
  },

  // Ham nay dung de lay tai khoan theo accountId de phuc vu auth middleware va profile.
  // Nhan vao: accountId la khoa chinh cua tai khoan, options co the chua executor.
  // Tra ve: ban ghi account hoac null neu khong ton tai trong DB.
  async findByAccountId(accountId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          account_id,
          full_name,
          email,
          phone,
          role,
          status,
          dob,
          gender,
          avatar_url,
          last_login_at
        FROM accounts
        WHERE account_id = ?
        LIMIT 1
      `;
      const [rows] = await executor.execute(query, [accountId]);
      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findByAccountId):", error);
      throw error;
    }
  },

  // Ham nay dung de tim tai khoan theo email phuc vu validate trung khi cap nhat profile.
  // Nhan vao: email da duoc chuan hoa va options co the chua executor.
  // Tra ve: ban ghi toi gian chua account_id hoac null neu khong tim thay.
  async findByEmail(email, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT account_id, email
        FROM accounts
        WHERE email = ?
        LIMIT 1
      `;
      const [rows] = await executor.execute(query, [email]);
      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findByEmail):", error);
      throw error;
    }
  },

  // Ham nay dung de tim tai khoan theo so dien thoai phuc vu validate trung khi cap nhat profile.
  // Nhan vao: phone la gia tri can kiem tra va options co the chua executor.
  // Tra ve: ban ghi toi gian chua account_id hoac null neu khong tim thay.
  async findByPhone(phone, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT account_id, phone
        FROM accounts
        WHERE phone = ?
        LIMIT 1
      `;
      const [rows] = await executor.execute(query, [phone]);
      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findByPhone):", error);
      throw error;
    }
  },

  // Ham nay dung de lay password hash hien tai cua tai khoan phuc vu luong doi mat khau.
  // Nhan vao: accountId la ma tai khoan dang dang nhap, options co the chua executor.
  // Tra ve: ban ghi toi gian gom account_id, password_hash va status, hoac null neu khong ton tai.
  async findPasswordCredentialsByAccountId(accountId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          account_id,
          email,
          password_hash,
          status
        FROM accounts
        WHERE account_id = ?
        LIMIT 1
      `;
      const [rows] = await executor.execute(query, [accountId]);
      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findPasswordCredentialsByAccountId):", error);
      throw error;
    }
  },

  // Ham nay dung de chen mot tai khoan moi vao bang accounts.
  // Nhan vao: accountPayload chua du lieu tai khoan can tao, options co the chua executor.
  // Tra ve: boolean cho biet lenh INSERT co thanh cong hay khong.
  async createAccount(accountPayload, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        INSERT INTO accounts (
          account_id,
          full_name,
          dob,
          gender,
          email,
          phone,
          password_hash,
          role,
          status,
          avatar_url,
          terms_accepted
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await executor.execute(query, [
        accountPayload.accountId,
        accountPayload.fullName,
        accountPayload.dob,
        accountPayload.gender,
        accountPayload.email,
        accountPayload.phone,
        accountPayload.passwordHash,
        accountPayload.role,
        accountPayload.status,
        accountPayload.avatarUrl || null,
        accountPayload.termsAccepted ?? true,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (createAccount):", error);
      throw error;
    }
  },

  // Ham nay dung de cap nhat thoi diem dang nhap gan nhat cua tai khoan.
  // Nhan vao: accountId la ma tai khoan, options co the chua executor.
  // Tra ve: boolean cho biet lenh UPDATE co anh huong den ban ghi nao khong.
  async touchLastLogin(accountId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        UPDATE accounts
        SET last_login_at = CURRENT_TIMESTAMP
        WHERE account_id = ?
      `;
      const [result] = await executor.execute(query, [accountId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (touchLastLogin):", error);
      throw error;
    }
  },

  // Ham nay dung de luu OTP da hash va thoi gian het han cho mot tai khoan.
  // Nhan vao: accountId, otpHash, otpExpiry va options co the chua executor.
  // Tra ve: boolean cho biet lenh UPDATE co tac dong len ban ghi nao khong.
  async storePasswordResetOtp({ accountId, otpHash, otpExpiry }, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        UPDATE accounts
        SET
          reset_otp_hash = ?,
          otp_expiry = ?,
          reset_token_hash = NULL,
          reset_token_expiry = NULL
        WHERE account_id = ?
      `;
      const [result] = await executor.execute(query, [otpHash, otpExpiry, accountId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (storePasswordResetOtp):", error);
      throw error;
    }
  },

  // Ham nay dung de luu reset token sau khi OTP da duoc xac minh thanh cong.
  // Nhan vao: accountId, tokenHash, tokenExpiry va options co the chua executor.
  // Tra ve: boolean cho biet token moi da duoc luu thanh cong hay chua.
  async storePasswordResetToken({ accountId, tokenHash, tokenExpiry }, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        UPDATE accounts
        SET
          reset_otp_hash = NULL,
          otp_expiry = NULL,
          reset_token_hash = ?,
          reset_token_expiry = ?
        WHERE account_id = ?
      `;
      const [result] = await executor.execute(query, [tokenHash, tokenExpiry, accountId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (storePasswordResetToken):", error);
      throw error;
    }
  },

  // Ham nay dung de tim tai khoan theo reset token hash de cho phep dat lai mat khau.
  // Nhan vao: tokenHash la gia tri hash cua reset token, options co the chua executor.
  // Tra ve: ban ghi account can thiet cho buoc doi mat khau, hoac null neu khong tim thay.
  async findByPasswordResetTokenHash(tokenHash, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        SELECT
          account_id,
          email,
          status,
          reset_token_expiry
        FROM accounts
        WHERE reset_token_hash = ?
        LIMIT 1
      `;
      const [rows] = await executor.execute(query, [tokenHash]);
      return rows[0] || null;
    } catch (error) {
      console.error("Model Error (findByPasswordResetTokenHash):", error);
      throw error;
    }
  },

  // Ham nay dung de cap nhat password hash moi cho tai khoan.
  // Nhan vao: accountId, passwordHash va options co the chua executor.
  // Tra ve: boolean cho biet mat khau da duoc cap nhat thanh cong hay chua.
  async updatePasswordHash(accountId, passwordHash, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        UPDATE accounts
        SET password_hash = ?
        WHERE account_id = ?
      `;
      const [result] = await executor.execute(query, [passwordHash, accountId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (updatePasswordHash):", error);
      throw error;
    }
  },

  // Ham nay dung de cap nhat thong tin profile chung trong bang accounts.
  // Nhan vao: accountProfile chua cac field cho phep cap nhat va options co the chua executor.
  // Tra ve: boolean cho biet lenh UPDATE co anh huong den ban ghi nao khong.
  async updateAccountProfile(accountProfile, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        UPDATE accounts
        SET
          full_name = ?,
          dob = ?,
          gender = ?,
          email = ?,
          phone = ?,
          avatar_url = ?
        WHERE account_id = ?
      `;
      const [result] = await executor.execute(query, [
        accountProfile.fullName,
        accountProfile.dob,
        accountProfile.gender,
        accountProfile.email,
        accountProfile.phone,
        accountProfile.avatarUrl,
        accountProfile.accountId,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (updateAccountProfile):", error);
      throw error;
    }
  },

  // Ham nay dung de xoa OTP va reset token sau khi da dung xong hoac bi loi.
  // Nhan vao: accountId va options co the chua executor.
  // Tra ve: boolean cho biet ban ghi da duoc clear hay chua.
  async clearPasswordResetState(accountId, options = {}) {
    try {
      const executor = getExecutor(options.executor);
      const query = `
        UPDATE accounts
        SET
          reset_otp_hash = NULL,
          otp_expiry = NULL,
          reset_token_hash = NULL,
          reset_token_expiry = NULL
        WHERE account_id = ?
      `;
      const [result] = await executor.execute(query, [accountId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Model Error (clearPasswordResetState):", error);
      throw error;
    }
  },
};

module.exports = accountModel;
