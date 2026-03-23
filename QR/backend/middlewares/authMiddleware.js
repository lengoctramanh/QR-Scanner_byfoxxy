const crypto = require("crypto");

const accountModel = require("../models/accountModel");
const accountSessionModel = require("../models/accountSessionModel");

const SESSION_TTL_DAYS = 4;

// Ham nay dung de tach raw token tu header Authorization theo dung dinh dang Bearer.
// Nhan vao: authorizationHeader la gia tri header Authorization.
// Tra ve: raw token neu hop le, nguoc lai tra ve null.
const extractBearerToken = (authorizationHeader) => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token, ...extraParts] = String(authorizationHeader).trim().split(/\s+/);

  if (scheme !== "Bearer" || !token || extraParts.length > 0) {
    return null;
  }

  return token;
};

// Ham nay dung de bam session token bang SHA-256 truoc khi doi chieu voi du lieu DB.
// Nhan vao: rawToken la token goc nhan tu client.
// Tra ve: chuoi hex tokenHash.
const hashSessionToken = (rawToken) => crypto.createHash("sha256").update(rawToken).digest("hex");

// Ham nay dung de tao payload JSON thong nhat cho loi chua duoc xac thuc.
// Nhan vao: message la noi dung loi can tra ve.
// Tra ve: object JSON don gian co success/message.
const buildUnauthorizedResponse = (message) => ({
  success: false,
  message,
});

// Ham nay dung de tao auth payload dua tren session va account da duoc xac thuc.
// Nhan vao: rawToken, tokenHash, session va account.
// Tra ve: object auth gan vao req.auth cho cac route can xac thuc.
const buildAuthPayload = (rawToken, tokenHash, session, account) => ({
  token: rawToken,
  tokenHash,
  sessionId: session.session_id,
  accountId: session.account_id,
  role: account.role,
  status: account.status,
  expiresAt: new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000),
  lastActiveAt: new Date(),
  deviceInfo: session.device_info,
  deviceType: session.device_type,
  ipAtLogin: session.ip_at_login,
  locationAtLogin: session.location_at_login,
});

// Ham nay dung de resolve toan bo trang thai xac thuc cua request ma khong ep buoc route phai bao loi ngay.
// Nhan vao: req la request hien tai.
// Tra ve: object chua ket qua authenticated/ly do that bai de middleware dung lai.
const resolveAuthenticationContext = async (req) => {
  const rawToken = extractBearerToken(req.get("authorization"));

  if (!rawToken) {
    return {
      isAuthenticated: false,
      hasAuthorizationHeader: Boolean(req.get("authorization")),
      reason: "missing_token",
      httpStatus: 401,
      message: "Missing or invalid Authorization header. Use: Bearer <token>.",
    };
  }

  const tokenHash = hashSessionToken(rawToken);
  const session = await accountSessionModel.findActiveSessionByTokenHash(tokenHash);

  if (!session) {
    return {
      isAuthenticated: false,
      hasAuthorizationHeader: true,
      reason: "expired_or_invalid",
      httpStatus: 401,
      message: "Session is invalid, expired, or has been revoked.",
    };
  }

  const account = await accountModel.findByAccountId(session.account_id);

  if (!account) {
    return {
      isAuthenticated: false,
      hasAuthorizationHeader: true,
      reason: "account_missing",
      httpStatus: 401,
      message: "Account does not exist for this session.",
    };
  }

  if (account.status === "banned") {
    return {
      isAuthenticated: false,
      hasAuthorizationHeader: true,
      reason: "account_banned",
      httpStatus: 403,
      message: "This account has been blocked. Please contact an administrator.",
    };
  }

  if (account.role === "admin" && account.status !== "active") {
    return {
      isAuthenticated: false,
      hasAuthorizationHeader: true,
      reason: "admin_inactive",
      httpStatus: 403,
      message: "The admin account is not active yet.",
    };
  }

  await accountSessionModel.touchLastActive(session.session_id);

  return {
    isAuthenticated: true,
    hasAuthorizationHeader: true,
    reason: null,
    auth: buildAuthPayload(rawToken, tokenHash, session, account),
    account,
  };
};

// Ham nay dung de bat buoc request phai co session hop le truoc khi vao route bao ve.
// Nhan vao: req, res, next cua Express.
// Tac dong: xac minh Bearer token, nap req.auth/req.account va goi next neu hop le.
const requireAuth = async (req, res, next) => {
  try {
    const resolvedAuth = await resolveAuthenticationContext(req);

    if (!resolvedAuth.isAuthenticated) {
      return res.status(resolvedAuth.httpStatus).json(buildUnauthorizedResponse(resolvedAuth.message));
    }

    req.auth = resolvedAuth.auth;
    req.account = resolvedAuth.account;
    req.authState = {
      isAuthenticated: true,
      mode: "authenticated",
      reason: null,
    };

    return next();
  } catch (error) {
    console.error("Middleware Error (requireAuth):", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Ham nay dung de nhan dien session neu co nhung van cho phep route cong khai tiep tuc chay.
// Nhan vao: req, res, next cua Express.
// Tac dong: neu token hop le thi gan req.auth, neu khong thi dat guest/expired mode de route tu xu ly.
const attachOptionalAuth = async (req, res, next) => {
  try {
    const resolvedAuth = await resolveAuthenticationContext(req);

    if (resolvedAuth.isAuthenticated) {
      req.auth = resolvedAuth.auth;
      req.account = resolvedAuth.account;
      req.authState = {
        isAuthenticated: true,
        mode: "authenticated",
        reason: null,
      };
      return next();
    }

    req.auth = null;
    req.account = null;
    req.authState = {
      isAuthenticated: false,
      mode: resolvedAuth.hasAuthorizationHeader ? "expired_session" : "guest",
      reason: resolvedAuth.reason,
    };

    return next();
  } catch (error) {
    console.error("Middleware Error (attachOptionalAuth):", error);
    req.auth = null;
    req.account = null;
    req.authState = {
      isAuthenticated: false,
      mode: "guest",
      reason: "middleware_error",
    };
    return next();
  }
};

// Ham nay dung de tao middleware kiem tra role duoc phep truy cap route.
// Nhan vao: allowedRoles la mot role hoac danh sach role hop le.
// Tra ve: middleware Express so sanh role hien tai va chan request neu khong du quyen.
const requireRole = (allowedRoles) => {
  const normalizedRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.auth || !req.account) {
      return res.status(500).json({
        success: false,
        message: "Authentication context has not been initialized.",
      });
    }

    if (!normalizedRoles.includes(req.account.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource.",
      });
    }

    return next();
  };
};

module.exports = {
  attachOptionalAuth,
  extractBearerToken,
  hashSessionToken,
  requireAuth,
  requireRole,
};
