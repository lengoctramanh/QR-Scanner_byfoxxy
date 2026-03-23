const fs = require("node:fs");
const path = require("node:path");

const BRAND_BATCH_ASSET_DIRECTORY = path.join(__dirname, "BrandBatchAssets");

const ensureBrandBatchAssetDirectory = () => {
  fs.mkdirSync(BRAND_BATCH_ASSET_DIRECTORY, { recursive: true });
  return BRAND_BATCH_ASSET_DIRECTORY;
};

const sanitizePathSegment = (value, fallback = "item") =>
  String(value || fallback)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "") || fallback;

// Ham nay dung de tao duong dan thu muc theo cau truc thuong hieu/catalog/batch.
// Nhan vao: brandName, productName, batchCode.
// Tra ve: object cac folder da duoc tao san tren o dia va public path tuong ung.
const buildBatchDirectoryPaths = ({ brandName, productName, batchCode }) => {
  const brandFolder = sanitizePathSegment(brandName, "brand");
  const catalogFolder = sanitizePathSegment(productName, "catalog");
  const batchFolder = sanitizePathSegment(batchCode, "batch");
  const batchDirectory = path.join(ensureBrandBatchAssetDirectory(), brandFolder, catalogFolder, batchFolder);

  fs.mkdirSync(batchDirectory, { recursive: true });

  return {
    brandFolder,
    catalogFolder,
    batchFolder,
    batchDirectory,
    relativeBatchDirectory: `app/BrandBatchAssets/${brandFolder}/${catalogFolder}/${batchFolder}`,
    publicBatchUrl: `/BrandBatchAssets/${brandFolder}/${catalogFolder}/${batchFolder}`,
  };
};

// Ham nay dung de tao duong dan luu asset cua tung nhan/tem trong mot batch.
// Nhan vao: thong tin thuong hieu, catalog, batch, sequenceNo va ten file.
// Tra ve: object chua duong dan tuyet doi, tuong doi va public url cua asset.
// Luu y: asset duoc dat truc tiep ben trong thu muc batch, khong tao them tang folder con.
const buildLabelAssetPaths = ({ brandName, productName, batchCode, sequenceNo, fileName }) => {
  const batchPaths = buildBatchDirectoryPaths({ brandName, productName, batchCode });
  const sequencePrefix = String(sequenceNo || 1).padStart(3, "0");
  const resolvedFileName = fileName.startsWith(`${sequencePrefix}-`) ? fileName : `${sequencePrefix}-${fileName}`;

  return {
    ...batchPaths,
    absolutePath: path.join(batchPaths.batchDirectory, resolvedFileName),
    relativeStoragePath: `${batchPaths.relativeBatchDirectory}/${resolvedFileName}`,
    publicUrl: `${batchPaths.publicBatchUrl}/${resolvedFileName}`,
  };
};

// Ham nay dung de quy doi storage path tu DB thanh duong dan tuyet doi tren backend.
// Nhan vao: storagePath la duong dan dang luu trong DB.
// Tra ve: absolute path co the dung de doc file/export zip.
const resolveBrandBatchAssetAbsolutePath = (storagePath) => {
  const normalizedStoragePath = String(storagePath || "")
    .trim()
    .replace(/\\/g, "/");

  if (!normalizedStoragePath) {
    return null;
  }

  const pathSegments = normalizedStoragePath.split("/").filter(Boolean);
  return path.join(__dirname, "..", ...pathSegments);
};

module.exports = {
  BRAND_BATCH_ASSET_DIRECTORY,
  buildBatchDirectoryPaths,
  buildLabelAssetPaths,
  ensureBrandBatchAssetDirectory,
  resolveBrandBatchAssetAbsolutePath,
  sanitizePathSegment,
};
