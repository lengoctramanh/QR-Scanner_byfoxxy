const crypto = require("crypto");
const { v4: createUUID } = require("uuid");

const db = require("../config/database");
const accountModel = require("../models/accountModel");
const accountSessionModel = require("../models/accountSessionModel");
const brandModel = require("../models/brandModel");
const passwordUtil = require("../utils/passwordUtil");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_REDIRECT_MAP = {
  admin: "/admin-dashboard",
  brand: "/brand-profile",
  user: "/profile",
};

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

// Ham nay dung de dong goi payload JSON tra ve sau khi dang nhap thanh cong.
// Nhan vao: account la ban ghi tai khoan, sessionId la ma phien, token la raw token.
// Tra ve: object body chuan de controller gui ve frontend.
const buildLoginPayload = (account, sessionId, token) => ({
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

      const isPasswordMatched = await passwordUtil.comparePassword(loginPayload.password, account.account_id, account.password_hash);

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
          body: buildLoginPayload(account, sessionId, rawToken),
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
    try {
      normalizeIdentifier(identifier);
    } catch (error) {
      return {
        isValid: false,
        httpStatus: 400,
        message: "Email or phone number is required.",
      };
    }

    return {
      isValid: true,
      httpStatus: 200,
      body: {
        success: true,
        message: "If an account exists for that email or phone, an OTP has been sent.",
      },
    };
  },

  // Ham nay dung de lay profile hien tai cua tai khoan dang dang nhap tu DB.
  // Nhan vao: accountId la ma tai khoan da duoc xac thuc tu session.
  // Tra ve: object ket qua nghiep vu chua profile de controller gui ve frontend.
  async getCurrentProfile(accountId) {
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
            brand:
              brandProfile
                ? {
                    brandId: brandProfile.brand_id,
                    brandName: brandProfile.brand_name,
                    logoUrl: brandProfile.logo_url,
                    taxId: brandProfile.tax_id,
                    website: brandProfile.website,
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
