const userModel = require("../models/userModel");
const userDashboardModel = require("../models/userDashboardModel");
const userScanHistoryModel = require("../models/userScanHistoryModel");
const { generateUserQrAssetImage } = require("../app/userQrAssetStorage");
const { buildScanTargetUrl, extractEmbeddedScanPayload } = require("../utils/websiteLinkUtil");
const scanService = require("./scanService");

// Ham nay dung de map thong tin product/brand/batch thanh object chi tiet de frontend mo modal.
// Nhan vao: row la dong du lieu tong hop tu query dashboard.
// Tra ve: object details da chuan hoa cho ca history va active.
const mapProductDetails = (row) => ({
  qrId: row.qr_id || null,
  productId: row.product_id || null,
  productName: row.product_name || "Unknown product",
  description: row.description || "",
  imageUrl: row.image_url || "",
  generalInfoUrl: row.general_info_url || "",
  manufacturerName: row.manufacturer_name || "",
  originCountry: row.origin_country || "",
  qualityCertifications: row.quality_certifications || "",
  brandId: row.brand_id || null,
  brandName: row.brand_name || "Pending brand",
  batchId: row.batch_id || row.log_batch_id || null,
  batchCode: row.batch_code || "",
  manufactureDate: row.manufacture_date || null,
  expiryDate: row.expiry_date || row.expires_at || null,
  activatedAt: row.activated_at || null,
  qrStatus: row.qr_status || "",
  totalPublicScans: row.total_public_scans ?? 0,
  totalPinAttempts: row.total_pin_attempts ?? 0,
});

// Ham nay dung de lay ten hien thi an toan cua san pham cho card va ten file QR.
// Nhan vao: row la dong du lieu tong hop.
// Tra ve: ten san pham neu co, nguoc lai la chuoi fallback de khong bi rong.
const getProductDisplayName = (row) => row.product_name || row.batch_code || "tracked-product";

// Ham nay dung de chon noi dung QR an toan de luu thanh anh PNG cho user.
// Nhan vao: row la dong du lieu active/history.
// Tra ve: chuoi safe content, uu tien public token hoac info token, khong phat lai secret token.
const getSafeSavedQrContent = (row) => {
  if (row.qr_public_token) {
    return row.qr_public_token;
  }

  if (row.qr_public_token_input) {
    return row.qr_public_token_input;
  }

  return "";
};

// Ham nay dung de chon noi dung scan goc de tao website-link QR ve lai trang web.
// Nhan vao: row la dong du lieu active/history.
// Tra ve: chuoi raw content ma frontend/backend co the resolve lai.
const getWebsiteScanTarget = (row) => {
  if (row.qr_public_token_input) {
    return row.qr_public_token_input;
  }

  if (row.qr_public_token) {
    return row.qr_public_token;
  }

  return "";
};

// Ham nay dung de tao cap anh QR cho tung item trong dashboard user.
// Nhan vao: object chua ten user va row hien tai.
// Tra ve: metadata website-link QR va saved-scan QR da luu trong QRSCANUSER.
const buildQrAssetBundle = async ({ userName, row, itemScope }) => {
  const productName = getProductDisplayName(row);
  const entityKey = row.qr_id || row.batch_id || row.log_batch_id || row.collection_id || row.user_history_id || "scan-item";
  const websiteScanTarget = getWebsiteScanTarget(row);
  const savedQrContent = getSafeSavedQrContent(row);
  const websiteLinkUrl = websiteScanTarget ? await buildScanTargetUrl(websiteScanTarget) : "";

  const assetResults = await Promise.all([
    websiteLinkUrl
      ? generateUserQrAssetImage({
          content: websiteLinkUrl,
          userName,
          productName,
          assetType: `${itemScope}-website-link-qr`,
          entityKey,
        })
      : Promise.resolve(null),
    savedQrContent
      ? generateUserQrAssetImage({
          content: savedQrContent,
          userName,
          productName,
          assetType: `${itemScope}-saved-scan-qr`,
          entityKey,
        })
      : Promise.resolve(null),
  ]);

  return {
    websiteLinkUrl,
    websiteLinkImageUrl: assetResults[0]?.publicUrl || "",
    savedScanImageUrl: assetResults[1]?.publicUrl || "",
  };
};

// Ham nay dung de quy doi loai history scan thanh nhan de doc tren giao dien.
// Nhan vao: scanType la gia tri enum trong scan_global_logs.
// Tra ve: label tieng Anh ngan gon cho card user dashboard.
const mapHistoryTypeLabel = (scanType) => {
  switch (scanType) {
    case "PUBLIC_SCAN":
      return "Authentication QR";
    case "PIN_VERIFICATION":
      return "Authentication QR";
    case "TOKEN_SCAN":
      return "Guest Token QR";
    default:
      return "Scanned QR";
  }
};

// Ham nay dung de dong goi mot dong active collection thanh item card de frontend render.
// Nhan vao: row la dong active collection, userName la ten user hien tai.
// Tra ve: object card hoan chinh cho tab Active Codes.
const mapActiveCollectionRow = async (row, userName) => {
  const qrAssets = await buildQrAssetBundle({
    userName,
    row,
    itemScope: "active",
  });

  return {
    id: row.collection_id,
    scope: "active",
    qrId: row.qr_id,
    qrType: "Owned Authentication QR",
    statusLabel: row.qr_status || "ACTIVE",
    statusTone: row.qr_status === "EXPIRED" ? "expired" : row.qr_status === "BLOCKED" || row.qr_status === "SUSPICIOUS" ? "warning" : "active",
    productName: getProductDisplayName(row),
    brandName: row.brand_name || "Pending brand",
    expiryDate: row.expiry_date || row.expires_at || null,
    boundAt: row.bound_at || null,
    scanCount: row.total_public_scans ?? 0,
    websiteLinkUrl: qrAssets.websiteLinkUrl,
    qrImages: {
      websiteLink: qrAssets.websiteLinkImageUrl,
      savedScan: qrAssets.savedScanImageUrl,
    },
    details: mapProductDetails(row),
  };
};

// Ham nay dung de dong goi mot dong history thanh item card de frontend render.
// Nhan vao: row la dong lich su scan va userName la ten user hien tai.
// Tra ve: object card day du metadata, timeline va detail san pham.
const mapHistoryRow = async (row, userName) => {
  const qrAssets = await buildQrAssetBundle({
    userName,
    row,
    itemScope: "history",
  });
  const details = mapProductDetails(row);

  return {
    id: row.user_history_id,
    scope: "history",
    qrId: row.qr_id || null,
    qrType: mapHistoryTypeLabel(row.scan_type),
    statusLabel: row.scan_result || "SCANNED",
    statusTone: row.scan_result === "EXPIRED" ? "expired" : row.scan_result === "BLOCKED" || row.scan_result === "OWNED" ? "warning" : "active",
    productName: getProductDisplayName(row),
    brandName: row.brand_name || "Pending brand",
    expiryDate: details.expiryDate,
    scannedAt: row.scanned_at || null,
    scanCount: details.totalPublicScans || 1,
    websiteLinkUrl: qrAssets.websiteLinkUrl,
    qrImages: {
      websiteLink: qrAssets.websiteLinkImageUrl,
      savedScan: qrAssets.savedScanImageUrl,
    },
    scanMeta: {
      scanType: row.scan_type || "",
      scanResult: row.scan_result || "",
      location: row.location || "",
      deviceInfo: row.device_info || "",
      ipAddress: row.ip_address || "",
    },
    details,
  };
};

const userDashboardService = {
  // Ham nay dung de tai du lieu that cho dashboard user, gom lich su scan va ma dang so huu.
  // Nhan vao: accountId la session dang dang nhap cua user.
  // Tra ve: object data da san sang cho frontend user dashboard.
  async getUserDashboard(accountId) {
    if (!accountId) {
      return {
        isValid: false,
        httpStatus: 401,
        message: "Unauthorized.",
      };
    }

    try {
      const userProfile = await userModel.findByAccountId(accountId);

      if (!userProfile) {
        return {
          isValid: false,
          httpStatus: 404,
          message: "User profile not found.",
        };
      }

      const [historyRows, activeRows] = await Promise.all([
        userDashboardModel.listScanHistoryByUserId(userProfile.user_id),
        userDashboardModel.listActiveCollectionsByUserId(userProfile.user_id),
      ]);

      const userName = userProfile.full_name || "user";
      const [history, activeCodes] = await Promise.all([
        Promise.all(historyRows.map((row) => mapHistoryRow(row, userName))),
        Promise.all(activeRows.map((row) => mapActiveCollectionRow(row, userName))),
      ]);

      return {
        isValid: true,
        httpStatus: 200,
        body: {
          success: true,
          data: {
            history,
            activeCodes,
          },
        },
      };
    } catch (error) {
      console.error("Service Error (getUserDashboard):", error);
      return {
        isValid: false,
        httpStatus: 500,
        message: "Unable to load the user dashboard right now.",
      };
    }
  },

  // Ham nay dung de claim Token(2) cho user dang dang nhap bang cach tai su dung flow guest token scan.
  // Nhan vao: accountId cua user session va tokenInput la raw token hoac URL chua guestToken.
  // Tra ve: ket qua claim + thong diep de frontend hien thi.
  async claimGuestTokenForUser(accountId, tokenInput) {
    const normalizedAccountId = String(accountId || "").trim();
    const normalizedTokenInput = String(tokenInput || "").trim();

    if (!normalizedAccountId) {
      return {
        isValid: false,
        httpStatus: 401,
        message: "Unauthorized.",
      };
    }

    if (!normalizedTokenInput) {
      return {
        isValid: false,
        httpStatus: 400,
        message: "Enter a valid Token(2) before claiming a QR code.",
      };
    }

    try {
      const userProfile = await userModel.findByAccountId(normalizedAccountId);

      if (!userProfile) {
        return {
          isValid: false,
          httpStatus: 404,
          message: "User profile not found.",
        };
      }

      const embeddedPayload = extractEmbeddedScanPayload(normalizedTokenInput);
      const guestToken = embeddedPayload.guestToken || normalizedTokenInput;

      if (!guestToken) {
        return {
          isValid: false,
          httpStatus: 400,
          message: "The provided Token(2) is invalid.",
        };
      }

      const scanResult = await scanService.handleGuestTokenScan(guestToken, normalizedTokenInput, {
        accountId: normalizedAccountId,
        role: "user",
        authMode: "authenticated",
      });

      const responseBody = scanResult?.body || {};
      const ownership = responseBody.data?.ownership || {};
      const isClaimBlocked = responseBody.verdict === "OWNED" || ownership.ownedByOther;
      const claimedNow = Boolean(ownership.claimedNow);
      const alreadyOwnedByViewer = Boolean(ownership.alreadyOwnedByViewer);

      let nextMessage = responseBody.message || "The token was processed successfully.";

      if (claimedNow) {
        nextMessage = "Token(2) claimed successfully. The QR code is now attached to your account.";
      } else if (alreadyOwnedByViewer) {
        nextMessage = "This Token(2) already belongs to your account, so the QR code remains active in your dashboard.";
      } else if (isClaimBlocked) {
        nextMessage =
          "This Token(2) points to a QR code that is already attached to another user account.";
      }

      return {
        isValid: true,
        httpStatus: scanResult?.httpStatus || 200,
        body: {
          success: true,
          message: nextMessage,
          data: {
            claim: {
              claimedNow,
              alreadyOwnedByViewer,
              ownedByOther: Boolean(ownership.ownedByOther),
              verdict: responseBody.verdict || "UNKNOWN",
              code: responseBody.code || null,
            },
            restoredResult: responseBody,
          },
        },
      };
    } catch (error) {
      console.error("Service Error (claimGuestTokenForUser):", error);
      return {
        isValid: false,
        httpStatus: 500,
        message: "Unable to claim Token(2) right now.",
      };
    }
  },

  // Ham nay dung de xoa mem mot item lich su scan cua user dang dang nhap.
  // Nhan vao: accountId la user session va userHistoryId la item can xoa.
  // Tra ve: ket qua nghiep vu de controller tra ve frontend.
  async deleteScanHistoryItem(accountId, userHistoryId) {
    const normalizedAccountId = String(accountId || "").trim();
    const normalizedHistoryId = String(userHistoryId || "").trim();

    if (!normalizedAccountId) {
      return {
        isValid: false,
        httpStatus: 401,
        message: "Unauthorized.",
      };
    }

    if (!normalizedHistoryId) {
      return {
        isValid: false,
        httpStatus: 400,
        message: "A scan history item is required.",
      };
    }

    try {
      const userProfile = await userModel.findByAccountId(normalizedAccountId);

      if (!userProfile) {
        return {
          isValid: false,
          httpStatus: 404,
          message: "User profile not found.",
        };
      }

      const deleted = await userScanHistoryModel.softDeleteHistoryEntry(
        userProfile.user_id,
        normalizedHistoryId,
      );

      if (!deleted) {
        return {
          isValid: false,
          httpStatus: 404,
          message: "The selected scan history item does not exist or was already removed.",
        };
      }

      return {
        isValid: true,
        httpStatus: 200,
        body: {
          success: true,
          message: "The scan history item was removed from your dashboard.",
          data: {
            userHistoryId: normalizedHistoryId,
          },
        },
      };
    } catch (error) {
      console.error("Service Error (deleteScanHistoryItem):", error);
      return {
        isValid: false,
        httpStatus: 500,
        message: "Unable to remove the scan history item right now.",
      };
    }
  },
};

module.exports = userDashboardService;
