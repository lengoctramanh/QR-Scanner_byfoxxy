const fs = require("fs/promises");
const path = require("path");
const QRCode = require("qrcode");

const USER_QR_DIRECTORY = path.join(__dirname, "QRSCANUSER");
const MAX_SLUG_LENGTH = 48;

// Ham nay dung de dam bao thu muc QRSCANUSER ton tai truoc khi ghi file PNG moi.
// Nhan vao: khong nhan tham so nao.
// Tra ve: duong dan thu muc sau khi da tao xong neu can.
const ensureUserQrDirectory = async () => {
  await fs.mkdir(USER_QR_DIRECTORY, { recursive: true });
  return USER_QR_DIRECTORY;
};

// Ham nay dung de chuyen mot chuoi tu do thanh slug an toan de dat ten file.
// Nhan vao: value la chuoi goc can rut gon.
// Tra ve: slug chi gom a-z, 0-9 va dau gach ngang.
const toSlug = (value) => {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return (normalizedValue || "item").slice(0, MAX_SLUG_LENGTH);
};

// Ham nay dung de tao ten file PNG theo format user + product + loai QR.
// Nhan vao: object chua userName, productName, assetType va entityKey tuy chon.
// Tra ve: ten file PNG an toan de luu trong QRSCANUSER.
const buildUserQrAssetFileName = ({ userName, productName, assetType, entityKey = "" }) => {
  const fileNameParts = [toSlug(userName), toSlug(productName), toSlug(assetType)];

  if (entityKey) {
    fileNameParts.push(toSlug(entityKey));
  }

  return `${fileNameParts.join("_")}.png`;
};

// Ham nay dung de sinh file QR PNG tu noi dung can encode va luu vao QRSCANUSER.
// Nhan vao: object chua content, userName, productName, assetType va entityKey.
// Tra ve: metadata file vua duoc tao de frontend co the render ngay.
const generateUserQrAssetImage = async ({
  content,
  userName,
  productName,
  assetType,
  entityKey = "",
}) => {
  const normalizedContent = String(content || "").trim();

  if (!normalizedContent) {
    throw new Error("QR content is required to generate the user QR asset.");
  }

  await ensureUserQrDirectory();

  const fileName = buildUserQrAssetFileName({
    userName,
    productName,
    assetType,
    entityKey,
  });
  const filePath = path.join(USER_QR_DIRECTORY, fileName);

  await QRCode.toFile(filePath, normalizedContent, {
    type: "png",
    width: 380,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  return {
    fileName,
    filePath,
    publicUrl: `/QRSCANUSER/${fileName}`,
  };
};

module.exports = {
  USER_QR_DIRECTORY,
  ensureUserQrDirectory,
  toSlug,
  buildUserQrAssetFileName,
  generateUserQrAssetImage,
};
