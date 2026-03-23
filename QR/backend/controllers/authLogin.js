const authService = require("../services/authService");

// Ham nay dung de lay dia chi IP thuc cua request tu proxy hoac socket.
// Nhan vao: req la doi tuong request cua Express.
// Tra ve: chuoi IP da duoc rut gon hoac null neu khong xac dinh duoc.
const getRequestIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (forwardedFor) {
    return String(forwardedFor).split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || null;
};

const authLogin = {
  // Ham nay dung de xu ly API dang nhap va tra ket qua xac thuc ve cho client.
  // Nhan vao: req chua identifier/password va res de gui phan hoi HTTP.
  // Tac dong: goi authService.login, xu ly loi nghiep vu va tra JSON cho frontend.
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

  // Ham nay dung de tra ve profile hien tai cua tai khoan dang dang nhap.
  // Nhan vao: req da duoc requireAuth nap req.auth.accountId va res de gui JSON.
  // Tac dong: goi authService.getCurrentProfile va tra du lieu profile ve frontend.
  async getMe(req, res) {
    try {
      const accountId = req.auth?.accountId;

      if (!accountId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized.",
        });
      }

      const result = await authService.getCurrentProfile(accountId, req.auth);

      if (!result.isValid) {
        return res.status(result.httpStatus).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("Controller Error (getMe):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },
};

module.exports = authLogin;
