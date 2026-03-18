const { v4: createUUID } = require("uuid");

const db = require("../config/database");
const accountModel = require("../models/accountModel");
const userModel = require("../models/userModel");
const passwordUtil = require("../utils/passwordUtil");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeContact = (emailOrPhone) => {
  const normalizedValue = String(emailOrPhone || "").trim().toLowerCase();

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
  async exist(emailOrPhone) {
    return accountModel.checkExist(emailOrPhone);
  },

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
