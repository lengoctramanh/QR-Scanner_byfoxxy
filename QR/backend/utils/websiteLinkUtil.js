const websiteQrModel = require("../models/websiteQrModel");

const DEFAULT_PUBLIC_APP_URL = process.env.APP_PUBLIC_BASE_URL || "http://localhost:5173/";

// Ham nay dung de chuan hoa URL website cong khai truoc khi gan them query scan.
// Nhan vao: value la URL goc co the den tu DB hoac bien moi truong.
// Tra ve: doi tuong URL da hop le va da bo hash.
const normalizePublicBaseUrl = (value) => {
  const rawValue = String(value || "").trim() || DEFAULT_PUBLIC_APP_URL;
  const parsedUrl = new URL(rawValue);
  parsedUrl.hash = "";
  return parsedUrl;
};

// Ham nay dung de lay URL website cong khai hien tai do admin cau hinh hoac fallback env.
// Nhan vao: khong nhan tham so.
// Tra ve: chuoi URL day du de cac QR link co the tro ve dung website.
const getPublicWebsiteBaseUrl = async () => {
  try {
    const latestWebsiteQr = await websiteQrModel.findLatest();

    if (latestWebsiteQr?.website_url) {
      return normalizePublicBaseUrl(latestWebsiteQr.website_url).toString();
    }
  } catch (error) {
    console.error("Utility Error (getPublicWebsiteBaseUrl):", error);
  }

  return normalizePublicBaseUrl(DEFAULT_PUBLIC_APP_URL).toString();
};

// Ham nay dung de tao URL website co scanTarget de frontend mo vao trang web roi auto resolve.
// Nhan vao: rawScanTarget la noi dung QR goc can duoc tra cuu lai.
// Tra ve: chuoi URL day du co query scanTarget.
const buildScanTargetUrl = async (rawScanTarget) => {
  const websiteUrl = normalizePublicBaseUrl(await getPublicWebsiteBaseUrl());
  websiteUrl.searchParams.set("scanTarget", String(rawScanTarget || "").trim());
  return websiteUrl.toString();
};

// Ham nay dung de tao URL website co guestToken de frontend mo vao va claim/khai phuc ket qua.
// Nhan vao: guestToken la token raw da tao cho khach vang lai.
// Tra ve: chuoi URL day du co query guestToken.
const buildGuestTokenUrl = async (guestToken) => {
  const websiteUrl = normalizePublicBaseUrl(await getPublicWebsiteBaseUrl());
  websiteUrl.searchParams.set("guestToken", String(guestToken || "").trim());
  return websiteUrl.toString();
};

// Ham nay dung de nhin vao noi dung QR va tach scanTarget/guestToken neu day la URL web cua he thong.
// Nhan vao: rawContent la chuoi QR vua quet duoc.
// Tra ve: object gom guestToken, scanTarget va normalizedUrl neu parse thanh cong.
const extractEmbeddedScanPayload = (rawContent) => {
  const normalizedContent = String(rawContent || "").trim();

  if (!normalizedContent) {
    return {
      guestToken: null,
      scanTarget: null,
      normalizedUrl: null,
    };
  }

  try {
    const parsedUrl = new URL(normalizedContent);
    return {
      guestToken: parsedUrl.searchParams.get("guestToken"),
      scanTarget: parsedUrl.searchParams.get("scanTarget"),
      normalizedUrl: parsedUrl.toString(),
    };
  } catch (error) {
    return {
      guestToken: null,
      scanTarget: null,
      normalizedUrl: null,
    };
  }
};

module.exports = {
  DEFAULT_PUBLIC_APP_URL,
  normalizePublicBaseUrl,
  getPublicWebsiteBaseUrl,
  buildScanTargetUrl,
  buildGuestTokenUrl,
  extractEmbeddedScanPayload,
};
