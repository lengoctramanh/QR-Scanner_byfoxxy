const crypto = require("crypto");
const { v4: createUUID } = require("uuid");

const db = require("../config/database");
const accountModel = require("../models/accountModel");
const accountSessionModel = require("../models/accountSessionModel");
const passwordUtil = require("../utils/passwordUtil");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_REDIRECT_MAP = {
  admin: "/admin-dashboard",
  brand: "/brand-profile",
  user: "/profile",
};

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

const createSessionToken = () => {
  const rawToken = crypto.randomBytes(48).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  return {
    rawToken,
    tokenHash,
  };
};

const sanitizeEmail = (email) => {
  if (!email) {
    return null;
  }

  if (email.startsWith("phone_") && email.endsWith("@qr.local")) {
    return null;
  }

  return email;
};

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
};

module.exports = authService;
