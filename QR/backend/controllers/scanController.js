const scanService = require("../services/scanService");

const pickString = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const limitString = (value, maxLength) => {
  if (!value) {
    return null;
  }

  return value.slice(0, maxLength);
};

const extractIpAddress = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const rawIp = typeof forwardedFor === "string" ? forwardedFor.split(",")[0] : req.socket?.remoteAddress;
  return limitString(rawIp ? rawIp.trim() : null, 50);
};

const extractScanContext = (req) => ({
  accountId: limitString(
    pickString(req.body?.accountId, req.headers["x-account-id"]),
    50
  ),
  fingerprintId: limitString(
    pickString(req.body?.fingerprintId, req.headers["x-fingerprint-id"]),
    50
  ),
  ipAddress: extractIpAddress(req),
  location: limitString(
    pickString(req.body?.location, req.query?.location, req.headers["x-location"]),
    255
  ),
  deviceInfo: limitString(
    pickString(req.body?.deviceInfo, req.headers["x-device-info"], req.headers["user-agent"]),
    500
  ),
});

const scanController = {
  async scanPublic(req, res) {
    try {
      const result = await scanService.handlePublicScan(
        req.params.token,
        extractScanContext(req)
      );

      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("Controller Error (scanPublic):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error while processing public QR scan.",
      });
    }
  },

  async scanSecret(req, res) {
    try {
      const result = await scanService.handleSecretScan(
        req.body?.secretToken,
        extractScanContext(req)
      );

      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("Controller Error (scanSecret):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error while processing secret QR scan.",
      });
    }
  },
};

module.exports = scanController;
