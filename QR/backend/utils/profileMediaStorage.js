const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const PROFILE_MEDIA_DIRECTORIES = {
  userAvatar: path.join(__dirname, "..", "pictures", "userAvatar"),
  brandAvatar: path.join(__dirname, "..", "pictures", "brandAvatar"),
  brandLogo: path.join(__dirname, "..", "pictures", "logo"),
};

const MIME_EXTENSION_MAP = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/bmp": ".bmp",
  "image/tiff": ".tiff",
  "image/x-icon": ".ico",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "image/avif": ".avif",
};

// Ham nay dung de suy ra phan mo rong file anh tu ten goc hoac mimetype.
// Nhan vao: file la doi tuong multer da nap vao bo nho.
// Tra ve: chuoi extension co dau cham, mac dinh la .png neu khong doan duoc.
const resolveImageExtension = (file) => {
  const originalExtension = path.extname(String(file?.originalname || "")).toLowerCase();

  if (originalExtension) {
    return originalExtension;
  }

  return MIME_EXTENSION_MAP[String(file?.mimetype || "").toLowerCase()] || ".png";
};

// Ham nay dung de luu anh profile/avatar/logo vao thu muc static cua backend.
// Nhan vao: file tu multer va mediaType cho biet thu muc dich can luu.
// Tra ve: public URL de frontend hien thi lai ngay sau khi luu thanh cong.
const saveProfileMedia = async (file, mediaType) => {
  if (!file) {
    return null;
  }

  if (!String(file.mimetype || "").toLowerCase().startsWith("image/")) {
    throw new Error("Only image files are supported.");
  }

  const targetDirectory = PROFILE_MEDIA_DIRECTORIES[mediaType];

  if (!targetDirectory) {
    throw new Error(`Unsupported media type: ${mediaType}`);
  }

  await fs.mkdir(targetDirectory, { recursive: true });

  const fileExtension = resolveImageExtension(file);
  const fileName = `${Date.now()}-${crypto.randomUUID()}${fileExtension}`;
  const absolutePath = path.join(targetDirectory, fileName);

  await fs.writeFile(absolutePath, file.buffer);

  const publicDirectory = path.basename(targetDirectory);
  return `/pictures/${publicDirectory}/${fileName}`;
};

module.exports = {
  saveProfileMedia,
};
