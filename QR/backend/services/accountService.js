const { v4: createUUID } = require("uuid");

const db = require("../config/database");
const accountModel = require("../models/accountModel");
const userModel = require("../models/userModel");
const passwordUtil = require("../utils/passwordUtil");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,19}$/;

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
      const normalizedEmail = String(registrationPayload.email || "")
        .trim()
        .toLowerCase();
      const normalizedPhone = String(registrationPayload.phone || "").trim() || null;

      if (!EMAIL_PATTERN.test(normalizedEmail)) {
        return {
          isValid: false,
          httpStatus: 400,
          message: "Email format is invalid.",
        };
      }

      if (normalizedPhone && !PHONE_PATTERN.test(normalizedPhone)) {
        return {
          isValid: false,
          httpStatus: 400,
          message: "Phone number format is invalid.",
        };
      }

      const existingEmailAccount = await accountModel.findByEmail(normalizedEmail, {
        executor: connection,
      });

      if (existingEmailAccount) {
        return {
          isValid: false,
          httpStatus: 409,
          message: "This email is already used by another account.",
        };
      }

      if (normalizedPhone) {
        const existingPhoneAccount = await accountModel.findByPhone(normalizedPhone, {
          executor: connection,
        });

        if (existingPhoneAccount) {
          return {
            isValid: false,
            httpStatus: 409,
            message: "This phone number is already used by another account.",
          };
        }
      }

      const passwordHash = await passwordUtil.hashPassword(registrationPayload.password, normalizedEmail);

      await connection.beginTransaction();

      await accountModel.createAccount(
        {
          accountId,
          fullName: registrationPayload.fullName,
          dob: registrationPayload.dob,
          gender: registrationPayload.gender || null,
          email: normalizedEmail,
          phone: normalizedPhone,
          passwordHash,
          role: "user",
          status: "active",
          avatarUrl: registrationPayload.avatarUrl || null,
          termsAccepted: registrationPayload.termsAccepted ?? true,
        },
        { executor: connection },
      );

      await userModel.createUserProfile(createUUID(), accountId, {
        executor: connection,
      });

      await connection.commit();

      return {
        isValid: true,
        httpStatus: 201,
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
