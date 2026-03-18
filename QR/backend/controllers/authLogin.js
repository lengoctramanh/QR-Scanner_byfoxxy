const authService = require("../services/authService");

const getRequestIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (forwardedFor) {
    return String(forwardedFor).split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || null;
};

const authLogin = {
  async login(req, res) {
    try {
      const { identifier, password } = req.body;

      const result = await authService.login({
        identifier,
        password,
        userAgent: req.get("user-agent"),
        deviceInfo: req.get("x-device-info"),
        location: req.get("x-location"),
        ipAddress: getRequestIp(req),
      });

      if (!result.isValid) {
        return res.status(result.httpStatus).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("Controller Error (login):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },
};

module.exports = authLogin;
