const { v4: createUUID } = require("uuid");

const db = require("../config/database");
const accountModel = require("../models/accountModel");
const userModel = require("../models/userModel");
const passwordUtil = require("../utils/passwordUtil");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Ham nay dung de chuan hoa thong tin lien he dang ky thanh cap email/phone luu DB.
// Nhan vao: emailOrPhone la gia tri nguoi dung nhap trong form dang ky.
// Tra ve: object chua email va phone da duoc chuan hoa; nem loi neu du lieu rong.
const normalizeContact = (emailOrPhone) => {
  const normalizedValue = String(emailOrPhone || "")
    .trim()
    .toLowerCase();

  if (!normalizedValue) {
    throw new Error("emailOrPhone is required");
  }

  if (EMAIL_PATTERN.test(normalizedValue)) {
    return {
      email: normalizedValue,
      phone: null,
    };
  }

  return {
    email: `phone_${normalizedValue}@qr.local`,
    phone: normalizedValue,
  };
};

const accountService = {
  // Ham nay dung de kiem tra email hoac so dien thoai da ton tai trong bang accounts hay chua.
  // Nhan vao: emailOrPhone la gia tri can kiem tra.
  // Tra ve: boolean cho biet co ton tai tai khoan trung thong tin hay khong.
  async exist(emailOrPhone) {
    return accountModel.checkExist(emailOrPhone);
  },

  // Ham nay dung de tao tai khoan user thuong va ho so user mac dinh trong DB.
  // Nhan vao: registrationPayload chua thong tin dang ky cua user.
  // Tra ve: object ket qua nghiep vu, dong thoi ghi du lieu vao accounts va users.
  async createUserAccount(registrationPayload) {
    const connection = await db.getConnection();

    try {
      const accountId = createUUID();
      const contact = normalizeContact(registrationPayload.emailOrPhone);
      const passwordHash = await passwordUtil.hashPassword(registrationPayload.password, accountId);

      await connection.beginTransaction();

      await accountModel.createAccount(
        {
          accountId,
          fullName: registrationPayload.fullName,
          dob: registrationPayload.dob,
          gender: registrationPayload.gender || null,
          email: contact.email,
          phone: contact.phone,
          passwordHash,
          role: "user",
          status: "active",
        },
        { executor: connection },
      );

      await userModel.createUserProfile(createUUID(), accountId, {
        executor: connection,
      });

      await connection.commit();

      return {
        isValid: true,
        message: "Registration successful.",
      };
    } catch (error) {
      await connection.rollback();
      console.error("Service Error (createAccount):", error);
      return {
        isValid: false,
        message: "Internal error during account creation.",
      };
    } finally {
      connection.release();
    }
  },
};

module.exports = accountService;
