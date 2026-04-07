const crypto = require("crypto");
const { v4: createUUID } = require("uuid");

const db = require("../config/database");
const accountModel = require("../models/accountModel");
const accountSessionModel = require("../models/accountSessionModel");
const brandModel = require("../models/brandModel");
const passwordUtil = require("../utils/passwordUtil");
const { sendPasswordResetOtpEmail } = require("./mailService");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_REDIRECT_MAP = {
  admin: "/admin-dashboard",
  brand: "/brand-profile",
  user: "/profile",
};
const PASSWORD_RESET_OTP_MINUTES = 5;
const PASSWORD_RESET_TOKEN_MINUTES = 10;
const PASSWORD_MIN_LENGTH = 8;
const SESSION_TTL_DAYS = 4;
const GENERIC_PASSWORD_RESET_MESSAGE = "If an account exists for that email or phone, an OTP has been sent.";
const INVALID_PASSWORD_RESET_OTP_MESSAGE = "Invalid or expired verification code.";
const INVALID_PASSWORD_RESET_TOKEN_MESSAGE = "Reset session is invalid or has expired.";
const passwordResetTokenStore = new Map();

// Ham nay dung de chuan hoa identifier dang nhap truoc khi tim tai khoan.
// Nhan vao: identifier la email hoac so dien thoai nguoi dung nhap.
// Tra ve: chuoi da trim va lower-case neu la email; nem loi neu gia tri rong.
const normalizeIdentifier = (identifier) => {
  const normalizedIdentifier = String(identifier || "").trim();

  if (!normalizedIdentifier) {
    throw new Error("identifier is required");
  }

  if (EMAIL_PATTERN.test(normalizedIdentifier)) {
    return normalizedIdentifier.toLowerCase();
  }

  return normalizedIdentifier;
};

// Ham nay dung de suy ra loai thiet bi tu chuoi deviceInfo hoac user-agent.
// Nhan vao: deviceInfo la thong tin thiet bi dang nhap.
// Tra ve: mot trong cac gia tri tablet, mobile, desktop hoac unknown.
const buildDeviceType = (deviceInfo) => {
  const normalizedValue = String(deviceInfo || "").toLowerCase();

  if (/ipad|tablet/.test(normalizedValue)) {
    return "tablet";
  }

  if (/iphone|android|mobile/.test(normalizedValue)) {
    return "mobile";
  }

  if (/windows|macintosh|linux|desktop/.test(normalizedValue)) {
    return "desktop";
  }

  return "unknown";
};

// Ham nay dung de tao cap session token cho phien dang nhap moi.
// Nhan vao: khong nhan tham so.
// Tra ve: object chua rawToken gui cho client va tokenHash de luu DB.
const createSessionToken = () => {
  const rawToken = crypto.randomBytes(48).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  return {
    rawToken,
    tokenHash,
  };
};

// Ham nay dung de an email placeholder duoc tao tu so dien thoai.
// Nhan vao: email la gia tri email dang luu trong DB.
// Tra ve: email that neu hop le, hoac null neu day la email gia tao cho phone.
const sanitizeEmail = (email) => {
  if (!email) {
    return null;
  }

  if (email.startsWith("phone_") && email.endsWith("@qr.local")) {
    return null;
  }

  return email;
};

// Ham nay dung de hash gia tri OTP/reset token truoc khi luu hoac doi chieu.
// Nhan vao: rawValue la chuoi can hash.
// Tra ve: chuoi hash SHA-256 dang hex.
const hashValue = (rawValue) => crypto.createHash("sha256").update(String(rawValue || "")).digest("hex");

// Ham nay dung de tao ma OTP ngau nhien gom dung 6 chu so.
// Nhan vao: khong nhan tham so.
// Tra ve: chuoi OTP co do dai 6 ky tu so.
const createSixDigitOtp = () => crypto.randomInt(0, 1000000).toString().padStart(6, "0");

// Ham nay dung de tao reset token ngau nhien sau khi OTP da duoc xac minh.
// Nhan vao: khong nhan tham so.
// Tra ve: chuoi token hex dai de frontend gui lai khi doi mat khau.
const createPasswordResetToken = () => crypto.randomBytes(48).toString("hex");

// Ham nay dung de tao moc thoi gian tuong lai theo so phut truyen vao.
// Nhan vao: minutes la so phut can cong them tu hien tai.
// Tra ve: doi tuong Date het han.
const createFutureDate = (minutes) => new Date(Date.now() + minutes * 60 * 1000);

// Ham nay dung de kiem tra mot moc thoi gian da het han hay chua.
// Nhan vao: dateValue la Date/string tu DB.
// Tra ve: true neu khong co gia tri hoac da nho hon hien tai.
const isDateExpired = (dateValue) => !dateValue || new Date(dateValue).getTime() <= Date.now();

// Ham nay dung de xac dinh email co phai email gia tao tu so dien thoai hay khong.
// Nhan vao: email la dia chi dang luu trong DB.
// Tra ve: true neu email la placeholder, nguoc lai la false.
const isPhonePlaceholderEmail = (email) => !sanitizeEmail(email);

// Ham nay dung de an bot email hien thi tren giao dien quen mat khau.
// Nhan vao: email la dia chi email hop le.
// Tra ve: email da duoc mask, vi du th***@gmail.com.
const maskEmail = (email) => {
  if (!EMAIL_PATTERN.test(String(email || "").trim())) {
    return null;
  }

  const normalizedEmail = email.toLowerCase();
  const [localPart, domain] = normalizedEmail.split("@");
  const visibleLocal = localPart.slice(0, Math.min(2, localPart.length));
  const maskedLocal = `${visibleLocal}${"*".repeat(Math.max(0, localPart.length - visibleLocal.length))}`;

  return `${maskedLocal}@${domain}`;
};

// Ham nay dung de dong goi payload JSON tra ve sau khi dang nhap thanh cong.
// Nhan vao: account la ban ghi tai khoan, sessionId la ma phien, token la raw token.
// Tra ve: object body chuan de controller gui ve frontend.
const buildLoginPayload = (account, sessionId, token, sessionExpiresAt) => ({
  success: true,
  message: account.role === "brand" && account.status === "pending" ? "Login successful. Your brand account is still pending admin approval." : "Login successful.",
  token,
  data: {
    sessionId,
    accountId: account.account_id,
    fullName: account.full_name,
    email: sanitizeEmail(account.email),
    phone: account.phone,
    role: account.role,
    status: account.status,
    avatarUrl: account.avatar_url,
    dob: account.dob,
    gender: account.gender,
    redirectTo: ROLE_REDIRECT_MAP[account.role] || "/profile",
    session: {
      sessionId,
      expiresAt: sessionExpiresAt,
      ttlDays: SESSION_TTL_DAYS,
    },
    brand:
      account.role === "brand"
        ? {
            brandId: account.brand_id,
            brandName: account.brand_name,
            verified: Boolean(account.verified),
            verificationStatus: account.verification_status,
          }
        : null,
  },
});

// Ham nay dung de tao body response an toan cho buoc gui OTP.
// Nhan vao: normalizedIdentifier la identifier da duoc chuan hoa.
// Tra ve: object body voi thong diep generic va delivery hint neu co.
const buildPasswordResetRequestBody = (normalizedIdentifier) => ({
  success: true,
  message: GENERIC_PASSWORD_RESET_MESSAGE,
  data: {
    expiresInSeconds: PASSWORD_RESET_OTP_MINUTES * 60,
    deliveryHint: EMAIL_PATTERN.test(normalizedIdentifier) ? maskEmail(normalizedIdentifier) : null,
  },
});

// Ham nay dung de xoa tat ca reset token tam dang tro den cung mot account.
// Nhan vao: accountId can clear reset token.
// Tac dong: loai bo token da cu de tranh tai su dung.
const clearPasswordResetTokensForAccount = (accountId) => {
  for (const [token, tokenInfo] of passwordResetTokenStore.entries()) {
    if (tokenInfo.accountId === accountId) {
      passwordResetTokenStore.delete(token);
    }
  }
};

const authService = {
  // Ham nay dung de xu ly nghiep vu dang nhap, tao session va tra payload cho controller.
  // Nhan vao: loginPayload chua identifier, password va metadata thiet bi.
  // Tra ve: object ket qua gom trang thai hop le, ma HTTP va body/message.
  async login(loginPayload) {
    let normalizedIdentifier;

    try {
      normalizedIdentifier = normalizeIdentifier(loginPayload.identifier);
    } catch (error) {
      return {
        isValid: false,
        httpStatus: 400,
        message: "Email or phone number is required.",
      };
    }

    if (!String(loginPayload.password || "").trim()) {
      return {
        isValid: false,
        httpStatus: 400,
        message: "Password is required.",
      };
    }

    try {
      const account = await accountModel.findByIdentifier(normalizedIdentifier);

      if (!account) {
        return {
          isValid: false,
          httpStatus: 401,
          message: "Invalid email, phone number, or password.",
        };
      }

      const isPasswordMatched = await passwordUtil.comparePassword(loginPayload.password, account.email, account.password_hash, account.account_id);

      if (!isPasswordMatched) {
        return {
          isValid: false,
          httpStatus: 401,
          message: "Invalid email, phone number, or password.",
        };
      }

      if (account.status === "banned") {
        return {
          isValid: false,
          httpStatus: 403,
          message: "This account has been blocked. Please contact an administrator.",
        };
      }

      if (account.role === "admin" && account.status !== "active") {
        return {
          isValid: false,
          httpStatus: 403,
          message: "The admin account is not active yet.",
        };
      }

      const connection = await db.getConnection();

      try {
        const sessionId = createUUID();
        const { rawToken, tokenHash } = createSessionToken();
        const deviceInfo = loginPayload.deviceInfo || loginPayload.userAgent || null;

        await connection.beginTransaction();

        await accountSessionModel.createSession(
          {
            sessionId,
            accountId: account.account_id,
            tokenHash,
            deviceInfo,
            deviceType: buildDeviceType(deviceInfo),
            ipAtLogin: loginPayload.ipAddress || null,
            locationAtLogin: loginPayload.location || null,
          },
          { executor: connection },
        );

        await accountModel.touchLastLogin(account.account_id, {
          executor: connection,
        });

        await connection.commit();

        return {
          isValid: true,
          httpStatus: 200,
          body: buildLoginPayload(
            account,
            sessionId,
            rawToken,
            new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000),
          ),
        };
      } catch (error) {
        await connection.rollback();
        console.error("Service Error (login transaction):", error);
        return {
          isValid: false,
          httpStatus: 500,
          message: "Unable to create a login session. Please try again.",
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Service Error (login):", error);
      return {
        isValid: false,
        httpStatus: 500,
        message: "Internal error during login.",
      };
    }
  },

  // Ham nay dung de xu ly nghiep vu yeu cau gui OTP dat lai mat khau.
  // Nhan vao: identifier la email hoac so dien thoai can khoi phuc.
  // Tra ve: object ket qua nghiep vu voi body thong bao an toan cho client.
  async requestPasswordResetOtp(identifier) {
    let normalizedIdentifier;

    try {
      normalizedIdentifier = normalizeIdentifier(identifier);
    } catch (error) {
      return {
        isValid: false,
        httpStatus: 400,
        message: "Email or phone number is required.",
      };
    }

    const safeResponseBody = buildPasswordResetRequestBody(normalizedIdentifier);

    try {
      const account = await accountModel.findPasswordResetAccountByIdentifier(normalizedIdentifier);

      if (!account || account.status === "banned" || isPhonePlaceholderEmail(account.email)) {
        return {
          isValid: true,
          httpStatus: 200,
          body: safeResponseBody,
        };
      }

      const otpCode = createSixDigitOtp();
      const otpHash = hashValue(otpCode);
      const otpExpiry = createFutureDate(PASSWORD_RESET_OTP_MINUTES);

        clearPasswordResetTokensForAccount(account.account_id);

        await accountModel.storePasswordResetOtp(
          {
            accountId: account.account_id,
            otpHash,
          otpExpiry,
        },
      );

      try {
        await sendPasswordResetOtpEmail({
          recipientEmail: account.email,
          fullName: account.full_name,
          otpCode,
          expiresInMinutes: PASSWORD_RESET_OTP_MINUTES,
        });
      } catch (mailError) {
        await accountModel.clearPasswordResetState(account.account_id);
        console.error("Service Error (requestPasswordResetOtp mail):", mailError);

        return {
          isValid: false,
          httpStatus: 500,
          message: "Unable to send the password reset OTP email right now. Please try again later.",
        };
      }

      return {
        isValid: true,
        httpStatus: 200,
        body: safeResponseBody,
      };
    } catch (error) {
      console.error("Service Error (requestPasswordResetOtp):", error);
      return {
        isValid: false,
        httpStatus: 500,
        message: "Unable to process the forgot password request.",
      };
    }
  },

  // Ham nay dung de xac minh ma OTP va sinh reset token cho buoc doi mat khau.
  // Nhan vao: payload gom identifier va otp nguoi dung vua nhap.
  // Tra ve: object ket qua xac minh, thanh cong se chua resetToken.
  async verifyPasswordResetOtp(payload) {
    let normalizedIdentifier;

    try {
      normalizedIdentifier = normalizeIdentifier(payload.identifier);
    } catch (error) {
      return {
        isValid: false,
        httpStatus: 400,
        message: "Email or phone number is required.",
      };
    }

    const otp = String(payload.otp || "").trim();

    if (!/^\d{6}$/.test(otp)) {
      return {
        isValid: false,
        httpStatus: 400,
        message: "OTP must contain exactly 6 digits.",
      };
    }

    try {
      const account = await accountModel.findPasswordResetAccountByIdentifier(normalizedIdentifier);

      if (!account || account.status === "banned" || isPhonePlaceholderEmail(account.email)) {
        return {
          isValid: false,
          httpStatus: 400,
          message: INVALID_PASSWORD_RESET_OTP_MESSAGE,
        };
      }

      if (!account.reset_otp_hash || isDateExpired(account.otp_expiry)) {
        await accountModel.clearPasswordResetState(account.account_id);
        clearPasswordResetTokensForAccount(account.account_id);

        return {
          isValid: false,
          httpStatus: 400,
          message: INVALID_PASSWORD_RESET_OTP_MESSAGE,
        };
      }

      if (hashValue(otp) !== account.reset_otp_hash) {
        return {
          isValid: false,
          httpStatus: 400,
          message: INVALID_PASSWORD_RESET_OTP_MESSAGE,
        };
      }

      const resetToken = createPasswordResetToken();
      const resetTokenExpiry = createFutureDate(PASSWORD_RESET_TOKEN_MINUTES);
      clearPasswordResetTokensForAccount(account.account_id);
      passwordResetTokenStore.set(resetToken, {
        accountId: account.account_id,
        expiresAt: resetTokenExpiry,
      });
      await accountModel.clearPasswordResetState(account.account_id);

      return {
        isValid: true,
        httpStatus: 200,
        body: {
          success: true,
          message: "OTP verified successfully.",
          data: {
            resetToken,
            resetTokenExpiresInSeconds: PASSWORD_RESET_TOKEN_MINUTES * 60,
          },
        },
      };
    } catch (error) {
      console.error("Service Error (verifyPasswordResetOtp):", error);
      return {
        isValid: false,
        httpStatus: 500,
        message: "Unable to verify the OTP right now.",
      };
    }
  },

  // Ham nay dung de cap nhat mat khau moi sau khi reset token da hop le.
  // Nhan vao: payload gom resetToken, newPassword va confirmPassword tuy chon.
  // Tra ve: object ket qua doi mat khau de controller tra ve frontend.
  async resetPasswordWithToken(payload) {
    const resetToken = String(payload.resetToken || "").trim();
    const newPassword = String(payload.newPassword || "");
    const confirmPassword = payload.confirmPassword == null ? null : String(payload.confirmPassword);

    if (!resetToken) {
      return {
        isValid: false,
        httpStatus: 400,
        message: "Reset token is required.",
      };
    }

    if (newPassword.trim().length < PASSWORD_MIN_LENGTH) {
      return {
        isValid: false,
        httpStatus: 400,
        message: `New password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      };
    }

    if (confirmPassword !== null && newPassword !== confirmPassword) {
      return {
        isValid: false,
        httpStatus: 400,
        message: "Confirm password does not match.",
      };
    }

    try {
      const resetTokenRecord = passwordResetTokenStore.get(resetToken);

      if (!resetTokenRecord) {
        return {
          isValid: false,
          httpStatus: 400,
          message: INVALID_PASSWORD_RESET_TOKEN_MESSAGE,
        };
      }

      if (isDateExpired(resetTokenRecord.expiresAt)) {
        passwordResetTokenStore.delete(resetToken);

        return {
          isValid: false,
          httpStatus: 400,
          message: INVALID_PASSWORD_RESET_TOKEN_MESSAGE,
        };
      }

      const account = await accountModel.findByAccountId(resetTokenRecord.accountId);

      if (!account || account.status === "banned") {
        passwordResetTokenStore.delete(resetToken);
        return {
          isValid: false,
          httpStatus: 400,
          message: INVALID_PASSWORD_RESET_TOKEN_MESSAGE,
        };
      }

      const passwordHash = await passwordUtil.hashPassword(newPassword, account.email);
      const connection = await db.getConnection();

      try {
        await connection.beginTransaction();

        await accountModel.updatePasswordHash(account.account_id, passwordHash, {
          executor: connection,
        });

        await accountModel.clearPasswordResetState(account.account_id, {
          executor: connection,
        });

        await accountSessionModel.revokeSessionsByAccountId(account.account_id, "Password reset completed.", {
          executor: connection,
        });

        await connection.commit();
        passwordResetTokenStore.delete(resetToken);

        return {
          isValid: true,
          httpStatus: 200,
          body: {
            success: true,
            message: "Password reset successfully. Please sign in again.",
          },
        };
      } catch (error) {
        await connection.rollback();
        console.error("Service Error (resetPasswordWithToken transaction):", error);
        return {
          isValid: false,
          httpStatus: 500,
          message: "Unable to update the password right now.",
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Service Error (resetPasswordWithToken):", error);
      return {
        isValid: false,
        httpStatus: 500,
        message: "Unable to reset the password right now.",
      };
    }
  },

  // Ham nay dung de cho phep tai khoan dang dang nhap doi mat khau trong trang ca nhan.
  // Nhan vao: payload gom accountId, currentPassword, newPassword va confirmPassword.
  // Tra ve: object ket qua nghiep vu de controller tra ve frontend.
  async changePassword(payload) {
    const accountId = String(payload.accountId || "").trim();
    const currentPassword = String(payload.currentPassword || "");
    const newPassword = String(payload.newPassword || "");
    const confirmPassword = String(payload.confirmPassword || "");

    if (!accountId) {
      return {
        isValid: false,
        httpStatus: 401,
        message: "Unauthorized.",
      };
    }

    if (!currentPassword.trim()) {
      return {
        isValid: false,
        httpStatus: 400,
        message: "Current password is required.",
      };
    }

    if (newPassword.trim().length < PASSWORD_MIN_LENGTH) {
      return {
        isValid: false,
        httpStatus: 400,
        message: `New password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        isValid: false,
        httpStatus: 400,
        message: "Confirm password does not match.",
      };
    }

    try {
      const account = await accountModel.findPasswordCredentialsByAccountId(accountId);

      if (!account || account.status === "banned") {
        return {
          isValid: false,
          httpStatus: 404,
          message: "Account not found.",
        };
      }

      const isCurrentPasswordMatched = await passwordUtil.comparePassword(currentPassword, account.email, account.password_hash, account.account_id);

      if (!isCurrentPasswordMatched) {
        return {
          isValid: false,
          httpStatus: 400,
          message: "Current password is incorrect.",
        };
      }

      const isSameAsCurrentPassword = await passwordUtil.comparePassword(newPassword, account.email, account.password_hash, account.account_id);

      if (isSameAsCurrentPassword) {
        return {
          isValid: false,
          httpStatus: 400,
          message: "New password must be different from the current password.",
        };
      }

      const passwordHash = await passwordUtil.hashPassword(newPassword, account.email);
      const connection = await db.getConnection();

      try {
        await connection.beginTransaction();

        await accountModel.updatePasswordHash(account.account_id, passwordHash, {
          executor: connection,
        });

        // Xoa reset state cu neu co, tranh de token/OTP con ton sau khi user tu doi mat khau.
        await accountModel.clearPasswordResetState(account.account_id, {
          executor: connection,
        });

        // Revoke toan bo session de buoc dang nhap lai bang mat khau moi tren moi thiet bi.
        await accountSessionModel.revokeSessionsByAccountId(account.account_id, "Password changed by the account owner.", {
          executor: connection,
        });

        await connection.commit();

        return {
          isValid: true,
          httpStatus: 200,
          body: {
            success: true,
            message: "Password updated successfully. Please sign in again.",
          },
        };
      } catch (error) {
        await connection.rollback();
        console.error("Service Error (changePassword transaction):", error);
        return {
          isValid: false,
          httpStatus: 500,
          message: "Unable to update the password right now.",
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Service Error (changePassword):", error);
      return {
        isValid: false,
        httpStatus: 500,
        message: "Unable to change the password right now.",
      };
    }
  },

  // Ham nay dung de lay profile hien tai cua tai khoan dang dang nhap tu DB.
  // Nhan vao: accountId la ma tai khoan da duoc xac thuc tu session.
  // Tra ve: object ket qua nghiep vu chua profile de controller gui ve frontend.
  async getCurrentProfile(accountId, sessionContext = null) {
    if (!accountId) {
      return {
        isValid: false,
        httpStatus: 401,
        message: "Unauthorized.",
      };
    }

    try {
      const account = await accountModel.findByAccountId(accountId);

      if (!account) {
        return {
          isValid: false,
          httpStatus: 404,
          message: "Account not found.",
        };
      }

      const brandProfile = account.role === "brand" ? await brandModel.findByAccountId(account.account_id) : null;

      return {
        isValid: true,
        httpStatus: 200,
        body: {
          success: true,
          data: {
            accountId: account.account_id,
            fullName: account.full_name,
            email: sanitizeEmail(account.email),
            phone: account.phone,
            dob: account.dob,
            gender: account.gender,
            role: account.role,
            status: account.status,
            avatarUrl: account.avatar_url,
            lastLoginAt: account.last_login_at,
            session: sessionContext
              ? {
                  sessionId: sessionContext.sessionId,
                  expiresAt: sessionContext.expiresAt,
                  ttlDays: SESSION_TTL_DAYS,
                }
              : null,
            brand:
              brandProfile
                ? {
                    brandId: brandProfile.brand_id,
                    brandName: brandProfile.brand_name,
                    logoUrl: brandProfile.logo_url,
                    taxId: brandProfile.tax_id,
                    website: brandProfile.website,
                    address: brandProfile.address,
                    industry: brandProfile.industry,
                    productCategories: brandProfile.product_categories,
                    verified: Boolean(brandProfile.verified),
                  }
                : null,
          },
        },
      };
    } catch (error) {
      console.error("Service Error (getCurrentProfile):", error);
      return {
        isValid: false,
        httpStatus: 500,
        message: "Unable to load the current user profile.",
      };
    }
  },
};

module.exports = authService;
