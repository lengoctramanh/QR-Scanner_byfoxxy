const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const QR_SCAN_DIRECTORY = path.join(__dirname, "QRScan");
const PROCESSED_QR_SCAN_DIRECTORY = path.join(__dirname, "ProcessedQRScan");
const MIME_EXTENSION_MAP = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

// Ham nay dung de dam bao thu muc app/QRScan luon ton tai truoc khi ghi file vao.
// Nhan vao: khong nhan tham so nao.
// Tra ve: duong dan tuyet doi den thu muc luu anh QR scan.
const ensureQrScanDirectory = () => {
  fs.mkdirSync(QR_SCAN_DIRECTORY, { recursive: true });
  return QR_SCAN_DIRECTORY;
};

// Ham nay dung de dam bao thu muc app/ProcessedQRScan ton tai de sau nay luu anh QR da xu ly.
// Nhan vao: khong nhan tham so nao.
// Tra ve: duong dan tuyet doi den thu muc luu anh QR da xu ly.
const ensureProcessedQrScanDirectory = () => {
  fs.mkdirSync(PROCESSED_QR_SCAN_DIRECTORY, { recursive: true });
  return PROCESSED_QR_SCAN_DIRECTORY;
};

// Ham nay dung de chuan hoa nguon anh duoc gui len tu giao dien.
// Nhan vao: source la chuoi mo ta anh den tu camera hay gallery.
// Tra ve: mot trong hai gia tri camera hoac gallery.
const normalizeSource = (source) => {
  const normalizedSource = String(source || "").trim().toLowerCase();
  return normalizedSource === "gallery" ? "gallery" : "camera";
};

// Ham nay dung de suy ra phan mo rong file anh tu originalname hoac mimetype.
// Nhan vao: file la doi tuong upload do multer cung cap.
// Tra ve: chuoi extension co dau cham, mac dinh la .jpg neu khong xac dinh duoc.
const resolveImageExtension = (file) => {
  const originalExtension = path.extname(file?.originalname || "").toLowerCase();

  if (originalExtension) {
    return originalExtension;
  }

  return MIME_EXTENSION_MAP[file?.mimetype] || ".jpg";
};

// Ham nay dung de tao ten file duy nhat cho moi anh duoc gui len de tranh trung lap.
// Nhan vao: source la nguon anh va extension la duoi file se luu.
// Tra ve: ten file moi phuc vu viec ghi xuong o dia.
const buildStoredFileName = (source, extension) =>
  `qrscan-${source}-${new Date().toISOString().replace(/[:.]/g, "-")}-${crypto.randomBytes(4).toString("hex")}${extension}`;

// Ham nay dung de tao ten file cho anh QR da qua xu ly trong tuong lai.
// Nhan vao: pictureId la id record trong bang pictures, extension la duoi file dau ra.
// Tra ve: ten file output on dinh de de truy vet giua DB va o dia.
const buildProcessedFileName = (pictureId, extension = ".png") =>
  `processed-qr-${pictureId}${extension}`;

// Ham nay dung de ghi anh upload vao thu muc app/QRScan va tao thong tin tra ve cho client.
// Nhan vao: object chua file do multer doc duoc va source xac dinh anh den tu dau.
// Tra ve: object metadata gom ten file, URL public va thoi diem da luu.
const saveScanImage = ({ file, source }) => {
  ensureQrScanDirectory();

  const normalizedSource = normalizeSource(source);
  const extension = resolveImageExtension(file);
  const fileName = buildStoredFileName(normalizedSource, extension);
  const absolutePath = path.join(QR_SCAN_DIRECTORY, fileName);

  fs.writeFileSync(absolutePath, file.buffer);

  return {
    fileName,
    source: normalizedSource,
    absolutePath,
    relativeStoragePath: `app/QRScan/${fileName}`,
    publicUrl: `/QRScan/${fileName}`,
    savedAt: new Date().toISOString(),
  };
};

// Ham nay dung de tao thong tin duong dan san cho anh da xu ly ma chua can chay thuat toan ngay.
// Nhan vao: pictureId la record anh goc va extension la duoi file du kien cua anh da xu ly.
// Tra ve: object metadata path de service xu ly OpenCV co the dung sau nay.
const buildProcessedImageTarget = (pictureId, extension = ".png") => {
  ensureProcessedQrScanDirectory();

  const fileName = buildProcessedFileName(pictureId, extension);

  return {
    fileName,
    absolutePath: path.join(PROCESSED_QR_SCAN_DIRECTORY, fileName),
    relativeStoragePath: `app/ProcessedQRScan/${fileName}`,
    publicUrl: `/ProcessedQRScan/${fileName}`,
  };
};

// Ham nay dung de ghi anh QR da duoc cat/xu ly xong vao thu muc ProcessedQRScan.
// Nhan vao: object chua pictureId, buffer anh output va extension hoac mimetype tuy chon.
// Tra ve: object metadata cua anh da xu ly de cap nhat bang pictures.
const saveProcessedScanImage = ({
  pictureId,
  buffer,
  extension,
  mimetype,
}) => {
  ensureProcessedQrScanDirectory();

  const resolvedExtension =
    typeof extension === "string" && extension.trim()
      ? extension.startsWith(".")
        ? extension.trim().toLowerCase()
        : `.${extension.trim().toLowerCase()}`
      : MIME_EXTENSION_MAP[String(mimetype || "").toLowerCase()] || ".png";

  const processedTarget = buildProcessedImageTarget(pictureId, resolvedExtension);
  fs.writeFileSync(processedTarget.absolutePath, buffer);

  return {
    fileName: processedTarget.fileName,
    absolutePath: processedTarget.absolutePath,
    relativeStoragePath: processedTarget.relativeStoragePath,
    publicUrl: processedTarget.publicUrl,
    savedAt: new Date().toISOString(),
  };
};

// Ham nay dung de quy doi duong dan luu tru tuong doi trong DB thanh duong dan tuyet doi tren backend.
// Nhan vao: relativeStoragePath la gia tri dang luu trong bang pictures.
// Tra ve: duong dan tuyet doi tren o dia hoac null neu dau vao khong hop le.
const resolveStorageAbsolutePath = (relativeStoragePath) => {
  const normalizedStoragePath = String(relativeStoragePath || "")
    .trim()
    .replace(/\\/g, "/");

  if (!normalizedStoragePath) {
    return null;
  }

  const relativeSegments = normalizedStoragePath.split("/").filter(Boolean);
  return path.join(__dirname, "..", ...relativeSegments);
};

module.exports = {
  buildProcessedImageTarget,
  ensureProcessedQrScanDirectory,
  ensureQrScanDirectory,
  resolveStorageAbsolutePath,
  saveScanImage,
  saveProcessedScanImage,
};
