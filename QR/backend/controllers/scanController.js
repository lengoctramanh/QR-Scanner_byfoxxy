const scanService = require("../services/scanService");

// Ham nay dung de lay gia tri chuoi dau tien hop le tu nhieu nguon khac nhau.
// Nhan vao: danh sach values can kiem tra.
// Tra ve: chuoi da trim dau/cuoi hoac null neu khong co gia tri hop le.
const pickString = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

// Ham nay dung de cat chuoi theo do dai toi da nham tranh luu du lieu qua dai.
// Nhan vao: value la chuoi can cat, maxLength la gioi han do dai.
// Tra ve: chuoi da cat hoac null neu khong co gia tri.
const limitString = (value, maxLength) => {
  if (!value) {
    return null;
  }

  return value.slice(0, maxLength);
};

// Ham nay dung de trich xuat dia chi IP tu request scan.
// Nhan vao: req la request cua Express.
// Tra ve: chuoi IP da duoc gioi han do dai hoac null.
const extractIpAddress = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const rawIp = typeof forwardedFor === "string" ? forwardedFor.split(",")[0] : req.socket?.remoteAddress;
  return limitString(rawIp ? rawIp.trim() : null, 50);
};

// Ham nay dung de gom toan bo thong tin boi canh scan tu body, query va header.
// Nhan vao: req la request hien tai.
// Tra ve: object scanContext chuan hoa de service scan su dung.
const extractScanContext = (req) => ({
  accountId: limitString(req.auth?.accountId || null, 50),
  role: req.auth?.role || null,
  sessionId: limitString(req.auth?.sessionId || null, 50),
  sessionExpiresAt: req.auth?.expiresAt || null,
  authMode: req.auth?.accountId ? "authenticated" : req.authState?.mode || "guest",
  authReason: req.authState?.reason || null,
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
  // Ham nay dung de nhan noi dung QR da giai ma va tu dong xu ly dung loai scan.
  // Nhan vao: req.body.qrContent, metadata request va res de gui phan hoi.
  // Tac dong: goi scanService.resolveScanContent va tra JSON thong nhat cho frontend.
  async resolveScan(req, res) {
    try {
      const result = await scanService.resolveScanContent(
        req.body?.qrContent,
        extractScanContext(req)
      );

      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("Controller Error (resolveScan):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error while resolving the QR content.",
      });
    }
  },

  // Ham nay dung de xu ly API quet public token cua QR.
  // Nhan vao: req.params.token, metadata trong request va res de gui ket qua.
  // Tac dong: goi scanService.handlePublicScan va tra JSON phan hoi.
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

  // Ham nay dung de xu ly API quet secret token de xac thuc QR.
  // Nhan vao: req.body.secretToken, metadata request va res de gui phan hoi.
  // Tac dong: goi scanService.handleSecretScan va tra JSON ket qua.
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

  // Ham nay dung de nhan anh quet tu frontend va chuyen sang service luu anh vao app/QRScan.
  // Nhan vao: req.file la anh upload, req.body.source la nguon anh, res de gui ket qua.
  // Tac dong: goi scanService.preprocessImage va tra JSON metadata anh da luu.
  async preprocessImage(req, res) {
    try {
      const result = await scanService.preprocessImage(req.file, req.body?.source);

      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("Controller Error (preprocessImage):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error while storing the scan image.",
      });
    }
  },

  // Ham nay dung de nhan anh va cho backend tu giai ma + resolve QR trong mot request dong bo.
  // Nhan vao: req.file, req.body.source va scanContext metadata.
  // Tac dong: goi scanService.resolveImage va tra ket qua scan + preview anh cho frontend.
  async resolveScanImage(req, res) {
    try {
      const result = await scanService.resolveImage(
        req.file,
        req.body?.source,
        extractScanContext(req)
      );

      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("Controller Error (resolveScanImage):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error while resolving the uploaded QR image.",
      });
    }
  },

  // Ham nay dung de tra ve trang thai xu ly OpenCV/Python cua anh QR da upload.
  // Nhan vao: req.params.pictureId va res de gui JSON metadata.
  // Tac dong: goi scanService.getPreprocessedImageStatus va tra ket qua cho frontend poll.
  async getPreprocessImageStatus(req, res) {
    try {
      const result = await scanService.getPreprocessedImageStatus(req.params?.pictureId);
      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("Controller Error (getPreprocessImageStatus):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error while loading the processed scan image status.",
      });
    }
  },
};

module.exports = scanController;
