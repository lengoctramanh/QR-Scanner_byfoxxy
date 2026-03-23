const fs = require("fs/promises");
const path = require("path");
const QRCode = require("qrcode");

const QR_URL_DIRECTORY = path.join(__dirname, "QRURL");
const MAX_COMPACT_URL_LENGTH = 80;

// Ham nay dung de dam bao thu muc luu QR URL da ton tai truoc khi ghi file moi.
// Nhan vao: khong nhan tham so.
// Tra ve: duong dan thu muc QRURL sau khi da duoc tao neu can.
const ensureUrlQrDirectory = async () => {
  await fs.mkdir(QR_URL_DIRECTORY, { recursive: true });
  return QR_URL_DIRECTORY;
};

// Ham nay dung de chuan hoa website URL truoc khi sinh QR va luu DB.
// Nhan vao: websiteUrl la duong dan admin vua nhap tren dashboard.
// Tra ve: chuoi URL hop le dang http/https da duoc normalize.
const normalizeWebsiteUrl = (websiteUrl) => {
  const rawWebsiteUrl = String(websiteUrl || "").trim();

  if (!rawWebsiteUrl) {
    throw new Error("Website URL is required.");
  }

  let normalizedUrl;

  try {
    normalizedUrl = new URL(rawWebsiteUrl);
  } catch (error) {
    throw new Error("Website URL is invalid. Use a full URL such as https://your-domain.com.");
  }

  if (!["http:", "https:"].includes(normalizedUrl.protocol)) {
    throw new Error("Website URL must start with http:// or https://.");
  }

  normalizedUrl.hash = "";
  return normalizedUrl.toString();
};

// Ham nay dung de rut gon URL thanh slug lien nhau de dua vao ten file QR.
// Nhan vao: websiteUrl la URL da nhap hoac da normalize.
// Tra ve: chuoi slug chi gom ky tu a-z va 0-9 de dat ten file an toan.
const buildCompactUrlSlug = (websiteUrl) => {
  const normalizedUrl = normalizeWebsiteUrl(websiteUrl)
    .replace(/^https?:\/\//i, "")
    .toLowerCase();

  const compactSlug = normalizedUrl.replace(/[^a-z0-9]/g, "");
  return (compactSlug || "website").slice(0, MAX_COMPACT_URL_LENGTH);
};

// Ham nay dung de tao ten file QR theo quy uoc url + so lan doi + URL rut gon.
// Nhan vao: changeNumber la so lan cap nhat va websiteUrl la URL hien tai.
// Tra ve: ten file PNG dung de luu vao thu muc QRURL.
const buildUrlQrFileName = (changeNumber, websiteUrl) => `url_${changeNumber}_${buildCompactUrlSlug(websiteUrl)}.png`;

// Ham nay dung de sinh file QR PNG tu website URL va tra ve metadata de luu DB.
// Nhan vao: websiteUrl va changeNumber cho phien ban moi.
// Tra ve: object chua URL da normalize, ten file, duong dan luu file va public URL.
const generateUrlQrImage = async ({ websiteUrl, changeNumber }) => {
  const normalizedUrl = normalizeWebsiteUrl(websiteUrl);
  const compactUrl = buildCompactUrlSlug(normalizedUrl);
  const fileName = buildUrlQrFileName(changeNumber, normalizedUrl);

  await ensureUrlQrDirectory();

  const filePath = path.join(QR_URL_DIRECTORY, fileName);

  // Logic nay duoc tich hop tu y tuong project QR URL ben ngoai: QR encode truc tiep mot URL dich.
  await QRCode.toFile(filePath, normalizedUrl, {
    type: "png",
    width: 420,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#0f172a",
      light: "#0000",
    },
  });

  return {
    normalizedUrl,
    compactUrl,
    fileName,
    filePath,
    publicUrl: `/QRURL/${fileName}`,
  };
};

module.exports = {
  QR_URL_DIRECTORY,
  ensureUrlQrDirectory,
  normalizeWebsiteUrl,
  buildCompactUrlSlug,
  buildUrlQrFileName,
  generateUrlQrImage,
};
