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
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await executor.execute(query, [accountPayload.accountId, accountPayload.fullName, accountPayload.dob, accountPayload.gender, accountPayload.email, accountPayload.phone, accountPayload.passwordHash, accountPayload.role, accountPayload.status]);

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
};

module.exports = accountModel;
