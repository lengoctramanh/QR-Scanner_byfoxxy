const crypto = require("crypto");

const accountModel = require("../models/accountModel");
const accountSessionModel = require("../models/accountSessionModel");

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

// Ham nay dung de bat buoc request phai co session hop le truoc khi vao route bao ve.
// Nhan vao: req, res, next cua Express.
// Tac dong: xac minh Bearer token, nap req.auth/req.account va goi next neu hop le.
const requireAuth = async (req, res, next) => {
  try {
    const rawToken = extractBearerToken(req.get("authorization"));

    if (!rawToken) {
      return res.status(401).json(buildUnauthorizedResponse("Missing or invalid Authorization header. Use: Bearer <token>."));
    }

    const tokenHash = hashSessionToken(rawToken);
    const session = await accountSessionModel.findActiveSessionByTokenHash(tokenHash);

    if (!session) {
      return res.status(401).json(buildUnauthorizedResponse("Session is invalid, expired, or has been revoked."));
    }

    const account = await accountModel.findByAccountId(session.account_id);

    if (!account) {
      return res.status(401).json(buildUnauthorizedResponse("Account does not exist for this session."));
    }

    if (account.status === "banned") {
      return res.status(403).json({
        success: false,
        message: "This account has been blocked. Please contact an administrator.",
      });
    }

    if (account.role === "admin" && account.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "The admin account is not active yet.",
      });
    }

    await accountSessionModel.touchLastActive(session.session_id);

    req.auth = {
      token: rawToken,
      tokenHash,
      sessionId: session.session_id,
      accountId: session.account_id,
      role: account.role,
      status: account.status,
      expiresAt: session.expires_at,
      lastActiveAt: session.last_active_at,
      deviceInfo: session.device_info,
      deviceType: session.device_type,
      ipAtLogin: session.ip_at_login,
      locationAtLogin: session.location_at_login,
    };

    req.account = account;

    return next();
  } catch (error) {
    console.error("Middleware Error (requireAuth):", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
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
  extractBearerToken,
  hashSessionToken,
  requireAuth,
  requireRole,
};
