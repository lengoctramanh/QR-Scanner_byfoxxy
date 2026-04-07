const fs = require("node:fs");
const path = require("node:path");
const { v4: createUUID } = require("uuid");
const JSZip = require("jszip");
const QRCode = require("qrcode");
const XLSX = require("xlsx");

const db = require("../config/database");
const qrEngine = require("../app/qrEngine");
const brandModel = require("../models/brandModel");
const batchModel = require("../models/batchModel");
const productModel = require("../models/productModel");
const qrCodeModel = require("../models/qrCodeModel");
const websiteQrModel = require("../models/websiteQrModel");
const batchQrLabelModel = require("../models/batchQrLabelModel");
const batchQrLabelAssetModel = require("../models/batchQrLabelAssetModel");
const {
  buildBatchDirectoryPaths,
  buildLabelAssetPaths,
  resolveBrandBatchAssetAbsolutePath,
  sanitizePathSegment,
} = require("../app/brandBatchAssetStorage");
const { getPublicWebsiteBaseUrl } = require("../utils/websiteLinkUtil");

const MAX_TEXT_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_SCAN_LIMIT = 999999999;
const MAX_ISSUE_QUANTITY = 500;
const LABEL_WIDTH_CM = 5;
const LABEL_HEIGHT_CM = 2;
const LABEL_QR_SIZE_CM = 1;
const BATCH_TEMPLATE_HEADERS = Object.freeze([
  "Product Name",
  "Manufacturer",
  "Country of Origin",
  "Manufacture Date",
  "Expiry Date",
  "Suspicious Scan Limit",
  "Issue Quantity",
  "Quality Certifications",
]);
const ASSET_KEY_BY_TYPE = Object.freeze({
  website_qr: "websiteQr",
  qr_1: "qr1",
  label_frame: "labelFrame",
});

const createErrorResult = (httpStatus, message) => ({ isValid: false, httpStatus, message });
const createSuccessResult = (httpStatus, body) => ({ isValid: true, httpStatus, body });
const sanitizeFileSlug = (value, fallback = "item") =>
  String(value || fallback)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "") || fallback;

const normalizeRequiredText = (value, fieldLabel, maxLength = MAX_TEXT_LENGTH) => {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) return `${fieldLabel} is required.`;
  if (normalizedValue.length > maxLength) {
    return `${fieldLabel} must not exceed ${maxLength} characters.`;
  }
  return normalizedValue;
};

const normalizeOptionalText = (value, maxLength = MAX_DESCRIPTION_LENGTH) =>
  String(value || "").trim().slice(0, maxLength);

const normalizeOptionalUrl = (value) => {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) return "";
  try {
    const parsedUrl = new URL(normalizedValue);
    return ["http:", "https:"].includes(parsedUrl.protocol) ? parsedUrl.toString() : null;
  } catch (error) {
    return null;
  }
};

const parsePositiveInteger = (value, fieldLabel, maxValue) => {
  const parsedValue = Number.parseInt(String(value ?? "").trim(), 10);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return `${fieldLabel} must be a positive integer.`;
  }
  if (Number.isInteger(maxValue) && parsedValue > maxValue) {
    return `${fieldLabel} must be less than or equal to ${maxValue}.`;
  }
  return parsedValue;
};

const normalizeDateValue = (value, fieldLabel) => {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) return `${fieldLabel} is required.`;
  const parsedDate = new Date(normalizedValue);
  if (Number.isNaN(parsedDate.getTime())) return `${fieldLabel} is invalid.`;
  return parsedDate.toISOString().slice(0, 10);
};

const buildBatchCode = (productName) =>
  `BAT-${sanitizeFileSlug(productName, "product").slice(0, 16).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

const validateProductPayload = (rawPayload = {}) => {
  const productName = normalizeRequiredText(rawPayload.productName, "Product name");
  if (typeof productName !== "string") return createErrorResult(400, productName);
  const manufacturerName = normalizeRequiredText(rawPayload.manufacturerName, "Manufacturer");
  if (typeof manufacturerName !== "string") return createErrorResult(400, manufacturerName);
  const originCountry = normalizeRequiredText(rawPayload.originCountry, "Country of origin");
  if (typeof originCountry !== "string") return createErrorResult(400, originCountry);
  const manufactureDate = normalizeDateValue(rawPayload.manufactureDate, "Manufacture date");
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(manufactureDate)) return createErrorResult(400, manufactureDate);
  const expiryDate = normalizeDateValue(rawPayload.expiryDate, "Expiry date");
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(expiryDate)) return createErrorResult(400, expiryDate);
  if (new Date(expiryDate).getTime() < new Date(manufactureDate).getTime()) {
    return createErrorResult(400, "Expiry date must be on or after the manufacture date.");
  }
  const scanLimit = parsePositiveInteger(rawPayload.scanLimit, "Suspicious scan limit", MAX_SCAN_LIMIT);
  if (!Number.isInteger(scanLimit)) return createErrorResult(400, scanLimit);
  const issueQuantity = parsePositiveInteger(rawPayload.issueQuantity || 1, "Issue quantity", MAX_ISSUE_QUANTITY);
  if (!Number.isInteger(issueQuantity)) return createErrorResult(400, issueQuantity);
  const generalInfoUrl = normalizeOptionalUrl(rawPayload.generalInfoUrl);
  if (rawPayload.generalInfoUrl && !generalInfoUrl) {
    return createErrorResult(400, "General info URL must be a valid http:// or https:// address.");
  }
  return {
    isValid: true,
    normalizedPayload: {
      productName,
      manufacturerName,
      originCountry,
      manufactureDate,
      expiryDate,
      qualityCertifications: normalizeOptionalText(rawPayload.qualityCertifications),
      description: normalizeOptionalText(rawPayload.description),
      generalInfoUrl: generalInfoUrl || "",
      scanLimit,
      issueQuantity,
    },
  };
};

const createTemplateWorkbookBuffer = () => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([
    BATCH_TEMPLATE_HEADERS,
    ["Example Facial Cleanser", "ABC Factory", "Vietnam", "2026-03-23", "2027-03-23", 5, 20, "ISO 22000, GMP"],
  ]);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Batch Template");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

const parseBatchSpreadsheetRows = (file) => {
  const workbook = XLSX.read(file.buffer, { type: "buffer" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(firstSheet, { defval: "" }).map((row) => ({
    productName: row["Product Name"],
    manufacturerName: row["Manufacturer"],
    originCountry: row["Country of Origin"],
    manufactureDate: row["Manufacture Date"],
    expiryDate: row["Expiry Date"],
    scanLimit: row["Suspicious Scan Limit"],
    issueQuantity: row["Issue Quantity"],
    qualityCertifications: row["Quality Certifications"],
  }));
};

const createSvgDataUrl = (svgContent) =>
  `data:image/svg+xml;base64,${Buffer.from(svgContent, "utf8").toString("base64")}`;

const createStandardQrSvg = async (value, options = {}) =>
  QRCode.toString(value, {
    type: "svg",
    errorCorrectionLevel: options.errorCorrectionLevel || "H",
    margin: options.margin ?? 1,
    width: options.width ?? 160,
    color: {
      dark: options.darkColor || "#0f172a",
      light: options.lightColor || "#ffffff",
    },
  });

const buildLabelPreviewSvg = ({ productName, batchCode, qrWebSvg, qr1Svg, sequenceNo }) => {
  const width = 500;
  const height = 200;
  const qrSize = 88;
  const top = 56;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="geometricPrecision">`,
    `<rect width="${width}" height="${height}" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />`,
    `<text x="18" y="25" fill="#0f172a" font-size="15" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${productName}</text>`,
    `<text x="18" y="43" fill="#64748b" font-size="11" font-family="Segoe UI, Arial, sans-serif">Batch ${batchCode} | Label ${String(sequenceNo).padStart(3, "0")}</text>`,
    `<image href="${createSvgDataUrl(qrWebSvg)}" x="18" y="${top}" width="${qrSize}" height="${qrSize}" />`,
    `<image href="${createSvgDataUrl(qr1Svg)}" x="150" y="${top}" width="${qrSize}" height="${qrSize}" />`,
    `<rect x="282" y="${top}" width="200" height="${qrSize}" rx="14" fill="#eef4ff" stroke="#cbd5e1" />`,
    `<text x="382" y="${top + 28}" fill="#0f172a" font-size="13" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-weight="700">Authentication-only label</text>`,
    `<text x="382" y="${top + 50}" fill="#64748b" font-size="10" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif">QR Web Link opens the main website.</text>`,
    `<text x="382" y="${top + 66}" fill="#64748b" font-size="10" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif">QR 1 is the only anti-counterfeit QR.</text>`,
    `<text x="62" y="158" fill="#3f78c9" font-size="11" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-weight="700">WEB LINK</text>`,
    `<text x="194" y="158" fill="#3f78c9" font-size="11" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-weight="700">QR 1</text>`,
    `</svg>`,
  ].join("");
};

const buildFactoryLabelSvg = ({ productName, batchCode, qrWebSvg, qr1Svg, sequenceNo }) => {
  const width = 500;
  const height = 200;
  const qrSize = 84;
  const top = 54;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="geometricPrecision">`,
    `<rect width="${width}" height="${height}" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />`,
    `<text x="18" y="25" fill="#0f172a" font-size="15" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${productName}</text>`,
    `<text x="18" y="43" fill="#64748b" font-size="11" font-family="Segoe UI, Arial, sans-serif">Batch ${batchCode} | Label ${String(sequenceNo).padStart(3, "0")}</text>`,
    `<image href="${createSvgDataUrl(qrWebSvg)}" x="18" y="${top}" width="${qrSize}" height="${qrSize}" />`,
    `<image href="${createSvgDataUrl(qr1Svg)}" x="150" y="${top}" width="${qrSize}" height="${qrSize}" />`,
    `<rect x="282" y="${top}" width="200" height="${qrSize}" rx="12" fill="#eef4ff" stroke="#cbd5e1" />`,
    `<text x="440" y="${top + 26}" fill="#1e293b" font-size="10" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-weight="700">PRINT GUIDE</text>`,
    `<text x="440" y="${top + 47}" fill="#64748b" font-size="9" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif">QR Web Link</text>`,
    `<text x="440" y="${top + 61}" fill="#64748b" font-size="9" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif">QR 1</text>`,
    `<text x="440" y="${top + 75}" fill="#64748b" font-size="9" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif">Authentication only</text>`,
    `</svg>`,
  ].join("");
};

const writeAssetFile = ({ brandName, productName, batchCode, sequenceNo, fileName, content }) => {
  const assetPaths = buildLabelAssetPaths({ brandName, productName, batchCode, sequenceNo, fileName });
  fs.writeFileSync(assetPaths.absolutePath, content, "utf8");
  return {
    fileName: path.basename(assetPaths.absolutePath),
    fileFormat: "svg",
    storagePath: assetPaths.relativeStoragePath,
    publicUrl: assetPaths.publicUrl,
  };
};

const createAssetRow = (labelId, assetType, assetFile, widthCm, heightCm) => ({
  assetId: createUUID(),
  labelId,
  assetType,
  fileName: assetFile.fileName,
  fileFormat: assetFile.fileFormat,
  storagePath: assetFile.storagePath,
  publicUrl: assetFile.publicUrl,
  widthCm,
  heightCm,
});

const removeBatchDirectoryIfExists = (directoryPath) => {
  if (directoryPath && fs.existsSync(directoryPath)) {
    fs.rmSync(directoryPath, { recursive: true, force: true });
  }
};

const groupLabelAssetsByBatch = (labelRows, assetRows) => {
  const labelsByBatchId = new Map();
  const labelsById = new Map();
  labelRows.forEach((labelRow) => {
    const normalizedLabel = {
      labelId: labelRow.label_id,
      qrId: labelRow.qr_id,
      sequenceNo: labelRow.sequence_no,
      labelCode: labelRow.label_code,
      storageRootPath: labelRow.storage_root_path,
      widthCm: Number(labelRow.width_cm),
      heightCm: Number(labelRow.height_cm),
      qrSizeCm: Number(labelRow.qr_size_cm),
      createdAt: labelRow.created_at,
      assets: {},
    };
    labelsById.set(labelRow.label_id, normalizedLabel);
    if (!labelsByBatchId.has(labelRow.batch_id)) labelsByBatchId.set(labelRow.batch_id, []);
    labelsByBatchId.get(labelRow.batch_id).push(normalizedLabel);
  });
  assetRows.forEach((assetRow) => {
    const targetLabel = labelsById.get(assetRow.label_id);
    if (!targetLabel) return;
    const assetKey = ASSET_KEY_BY_TYPE[assetRow.asset_type] || assetRow.asset_type;
    targetLabel.assets[assetKey] = {
      assetId: assetRow.asset_id,
      type: assetRow.asset_type,
      fileName: assetRow.file_name,
      fileFormat: assetRow.file_format,
      storagePath: assetRow.storage_path,
      publicUrl: assetRow.public_url,
      widthCm: assetRow.width_cm === null ? null : Number(assetRow.width_cm),
      heightCm: assetRow.height_cm === null ? null : Number(assetRow.height_cm),
    };
  });
  return labelsByBatchId;
};

const mapCatalogProducts = (catalogRows, labelRows, assetRows) => {
  const labelsByBatchId = groupLabelAssetsByBatch(labelRows, assetRows);
  const productsMap = new Map();
  catalogRows.forEach((row) => {
    if (!productsMap.has(row.product_id)) {
      productsMap.set(row.product_id, {
        productId: row.product_id,
        productName: row.product_name,
        brandId: row.brand_id,
        brandName: row.brand_name,
        manufacturerName: row.manufacturer_name,
        originCountry: row.origin_country,
        qualityCertifications: row.quality_certifications,
        description: row.description,
        generalInfoUrl: row.general_info_url,
        createdAt: row.product_created_at,
        batches: [],
      });
    }
    if (!row.batch_id) return;
    const labels = labelsByBatchId.get(row.batch_id) || [];
    productsMap.get(row.product_id).batches.push({
      batchId: row.batch_id,
      batchCode: row.batch_code,
      manufactureDate: row.manufacture_date,
      expiryDate: row.expiry_date,
      issueQuantity: row.quantity,
      createdAt: row.batch_created_at,
      totalPublicScans: row.total_public_scans ?? 0,
      totalPinAttempts: row.total_pin_attempts ?? 0,
      scanLimit: row.scan_limit ?? 0,
      exportUrl: `/api/brand/batches/${row.batch_id}/export`,
      labelCount: labels.length,
      labels,
    });
  });
  return Array.from(productsMap.values()).map((product) => ({
    ...product,
    batchCount: product.batches.length,
  }));
};

const loadWebsiteQrState = async () => {
  const latestWebsiteQr = await websiteQrModel.findLatest();
  const websiteUrl = latestWebsiteQr?.website_url || (await getPublicWebsiteBaseUrl());
  return {
    websiteUrl,
    websiteQrSvg: await createStandardQrSvg(websiteUrl, { width: 160 }),
  };
};

const generateLabelAssets = async ({
  brandName,
  productName,
  batchCode,
  qrRows,
  websiteQrState,
}) => {
  const batchDirectoryState = buildBatchDirectoryPaths({ brandName, productName, batchCode });
  const labelPayloads = [];
  const assetPayloads = [];
  const previewLabels = [];

  for (const printRow of qrRows) {
    const labelId = createUUID();
    const sequenceNo = printRow.sequenceNo;
    const labelCode = `${sanitizePathSegment(batchCode, "batch").toUpperCase()}-LBL-${String(sequenceNo).padStart(3, "0")}`;
    const qr1Svg = await createStandardQrSvg(printRow.secretToken, {
      width: 552,
      margin: 2,
      darkColor: "#0f172a",
      lightColor: "#ffffff",
    });
    const previewFrameSvg = buildLabelPreviewSvg({
      productName,
      batchCode,
      qrWebSvg: websiteQrState.websiteQrSvg,
      qr1Svg,
      sequenceNo,
    });
    const filePrefix = `${String(sequenceNo).padStart(3, "0")}-${sanitizeFileSlug(productName, "product")}`;
    const qrWebFile = writeAssetFile({ brandName, productName, batchCode, sequenceNo, fileName: `${filePrefix}-qr-web.svg`, content: websiteQrState.websiteQrSvg });
    const qr1File = writeAssetFile({ brandName, productName, batchCode, sequenceNo, fileName: `${filePrefix}-qr-1.svg`, content: qr1Svg });
    const labelFrameFile = writeAssetFile({ brandName, productName, batchCode, sequenceNo, fileName: `${filePrefix}-label-frame.svg`, content: previewFrameSvg });

    labelPayloads.push({
      labelId,
      batchId: printRow.batchId,
      qrId: printRow.qrId,
      sequenceNo,
      labelCode,
      storageRootPath: batchDirectoryState.relativeBatchDirectory,
      widthCm: LABEL_WIDTH_CM,
      heightCm: LABEL_HEIGHT_CM,
      qrSizeCm: LABEL_QR_SIZE_CM,
    });
    assetPayloads.push(
      createAssetRow(labelId, "website_qr", qrWebFile, LABEL_QR_SIZE_CM, LABEL_QR_SIZE_CM),
      createAssetRow(labelId, "qr_1", qr1File, LABEL_QR_SIZE_CM, LABEL_QR_SIZE_CM),
      createAssetRow(labelId, "label_frame", labelFrameFile, LABEL_WIDTH_CM, LABEL_HEIGHT_CM),
    );
    previewLabels.push({
      labelId,
      sequenceNo,
      labelCode,
      qrId: printRow.qrId,
      assets: {
        websiteQr: { publicUrl: qrWebFile.publicUrl },
        qr1: { publicUrl: qr1File.publicUrl },
        labelFrame: { publicUrl: labelFrameFile.publicUrl },
      },
    });
  }

  return { batchDirectoryState, labelPayloads, assetPayloads, previewLabels };
};

const createBatchSet = async (accountId, normalizedPayload) => {
  const brandProfile = await brandModel.findByAccountId(accountId);
  if (!brandProfile?.brand_id) {
    return createErrorResult(404, "Brand profile was not found for this account.");
  }

  const productId = createUUID();
  const batchId = createUUID();
  const batchCode = buildBatchCode(normalizedPayload.productName);
  const qrPayload = await qrEngine.createBulkQrPayload({
    quantity: normalizedPayload.issueQuantity,
    productId,
    batchId,
    scanLimit: normalizedPayload.scanLimit,
  });
  const qrRows = qrPayload.printRows.map((printRow) => ({ ...printRow, batchId }));
  const websiteQrState = await loadWebsiteQrState();
  let generatedAssets;

  try {
    generatedAssets = await generateLabelAssets({
      brandName: brandProfile.brand_name || "brand",
      productName: normalizedPayload.productName,
      batchCode,
      qrRows,
      websiteQrState,
    });
  } catch (error) {
    const fallbackBatchDirectory = buildBatchDirectoryPaths({
      brandName: brandProfile.brand_name || "brand",
      productName: normalizedPayload.productName,
      batchCode,
    });
    removeBatchDirectoryIfExists(fallbackBatchDirectory.batchDirectory);
    throw error;
  }
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    await productModel.createProduct(
      {
        productId,
        brandId: brandProfile.brand_id,
        productName: normalizedPayload.productName,
        description: normalizedPayload.description || null,
        imageUrl: null,
        generalInfoUrl: normalizedPayload.generalInfoUrl || null,
        manufacturerName: normalizedPayload.manufacturerName,
        originCountry: normalizedPayload.originCountry,
        qualityCertifications: normalizedPayload.qualityCertifications || null,
      },
      { executor: connection },
    );
    await batchModel.createBatch(
      {
        batchId,
        productId,
        batchCode,
        manufactureDate: normalizedPayload.manufactureDate,
        expiryDate: normalizedPayload.expiryDate,
        quantity: normalizedPayload.issueQuantity,
      },
      { executor: connection },
    );
    await qrCodeModel.bulkCreateQrCodes(qrPayload.dbRows, { executor: connection });
    await batchQrLabelModel.bulkCreateLabels(generatedAssets.labelPayloads, { executor: connection });
    await batchQrLabelAssetModel.bulkCreateAssets(generatedAssets.assetPayloads, { executor: connection });
    await connection.commit();
    return {
      isValid: true,
      productId,
      batchId,
      batchCode,
      preview: generatedAssets.previewLabels[0] || null,
      websiteUrl: websiteQrState.websiteUrl,
    };
  } catch (error) {
    await connection.rollback();
    removeBatchDirectoryIfExists(generatedAssets.batchDirectoryState.batchDirectory);
    throw error;
  } finally {
    connection.release();
  }
};

const buildLatestPreviewPayload = (websiteUrl, previewLabel) => ({
  webLink: { value: websiteUrl, imageUrl: previewLabel?.assets?.websiteQr?.publicUrl || "" },
  qr1: { value: "QR 1", imageUrl: previewLabel?.assets?.qr1?.publicUrl || "" },
  labelFrame: { imageUrl: previewLabel?.assets?.labelFrame?.publicUrl || "" },
});

const readSvgContentFromStorage = (storagePath) => {
  const absolutePath = resolveBrandBatchAssetAbsolutePath(storagePath);
  if (!absolutePath || !fs.existsSync(absolutePath)) return null;
  return fs.readFileSync(absolutePath, "utf8");
};

const buildExportRows = (labels = []) =>
  labels
    .map((label) => {
      const qrWebSvg = readSvgContentFromStorage(label.assets.websiteQr?.storagePath);
      const qr1Svg = readSvgContentFromStorage(label.assets.qr1?.storagePath);
      if (!qrWebSvg || !qr1Svg) return null;
      return { ...label, qrWebSvg, qr1Svg };
    })
    .filter(Boolean);

const brandProductService = {
  async createProductWithQr({ accountId, rawPayload }) {
    if (!accountId) {
      return createErrorResult(401, "You must be signed in as a brand to issue QR codes.");
    }

    try {
      const validationResult = validateProductPayload(rawPayload);
      if (!validationResult.isValid) return validationResult;

      const creationResult = await createBatchSet(accountId, validationResult.normalizedPayload);
      if (!creationResult.isValid) return creationResult;

      const listResult = await this.listProducts({ accountId });
      if (!listResult.isValid) return listResult;

      return createSuccessResult(201, {
        success: true,
        message: `Created ${validationResult.normalizedPayload.issueQuantity} QR label tag(s) successfully.`,
        data: {
          product: {
            productId: creationResult.productId,
            productName: validationResult.normalizedPayload.productName,
            batchId: creationResult.batchId,
            batchCode: creationResult.batchCode,
          },
          products: listResult.body.data,
          qrAssets: buildLatestPreviewPayload(creationResult.websiteUrl, creationResult.preview),
        },
      });
    } catch (error) {
      console.error("Service Error (createProductWithQr):", error);
      return createErrorResult(500, "Unable to create the product QR set right now.");
    }
  },

  async listProducts({ accountId }) {
    if (!accountId) {
      return createErrorResult(401, "You must be signed in as a brand to view your catalog.");
    }

    try {
      const brandProfile = await brandModel.findByAccountId(accountId);
      if (!brandProfile?.brand_id) {
        return createErrorResult(404, "Brand profile was not found for this account.");
      }

      const catalogRows = await batchModel.listCatalogBatchesByBrandId(brandProfile.brand_id);
      const batchIds = catalogRows.map((row) => row.batch_id).filter(Boolean);
      const [labelRows, assetRows] = await Promise.all([
        batchQrLabelModel.listByBatchIds(batchIds),
        batchQrLabelAssetModel.listByBatchIds(batchIds),
      ]);

      return createSuccessResult(200, {
        success: true,
        data: mapCatalogProducts(catalogRows, labelRows, assetRows),
      });
    } catch (error) {
      console.error("Service Error (listProducts):", error);
      return createErrorResult(500, "Unable to load the brand catalog right now.");
    }
  },

  async downloadBatchTemplate() {
    return {
      isValid: true,
      httpStatus: 200,
      fileName: "brand-batch-template.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: createTemplateWorkbookBuffer(),
    };
  },

  async uploadProductBatchFile({ accountId, file }) {
    if (!file?.buffer) {
      return createErrorResult(400, "Please choose an Excel, CSV or spreadsheet file first.");
    }

    try {
      const spreadsheetRows = parseBatchSpreadsheetRows(file).filter((row) =>
        Object.values(row).some((value) => String(value || "").trim()),
      );
      if (!spreadsheetRows.length) {
        return createErrorResult(400, "The uploaded spreadsheet does not contain any product rows.");
      }

      for (let rowIndex = 0; rowIndex < spreadsheetRows.length; rowIndex += 1) {
        const validationResult = validateProductPayload(spreadsheetRows[rowIndex]);
        if (!validationResult.isValid) {
          return createErrorResult(400, `Row ${rowIndex + 2}: ${validationResult.message}`);
        }
        const creationResult = await createBatchSet(accountId, validationResult.normalizedPayload);
        if (!creationResult.isValid) return creationResult;
      }

      const listResult = await this.listProducts({ accountId });
      if (!listResult.isValid) return listResult;

      return createSuccessResult(200, {
        success: true,
        message: "The batch spreadsheet was processed successfully.",
        data: listResult.body.data,
      });
    } catch (error) {
      console.error("Service Error (uploadProductBatchFile):", error);
      return createErrorResult(500, "Unable to process the uploaded batch file right now.");
    }
  },

  async exportBatchZip({ accountId, batchId }) {
    if (!accountId || !batchId) {
      return createErrorResult(400, "Batch export requires a signed-in brand account and a batch id.");
    }

    try {
      const brandProfile = await brandModel.findByAccountId(accountId);
      const batchSummary = await batchModel.findBatchSummaryById(batchId);
      if (!brandProfile?.brand_id || !batchSummary?.brand_id || batchSummary.brand_id !== brandProfile.brand_id) {
        return createErrorResult(404, "The requested batch could not be found for this brand.");
      }

      const [labelRows, assetRows] = await Promise.all([
        batchQrLabelModel.listByBatchIds([batchId]),
        batchQrLabelAssetModel.listByBatchIds([batchId]),
      ]);
      if (!labelRows.length) {
        return createErrorResult(404, "This batch does not have generated label assets yet.");
      }

      const labels = groupLabelAssetsByBatch(labelRows, assetRows).get(batchId) || [];
      const exportRows = buildExportRows(labels);
      if (!exportRows.length) {
        return createErrorResult(404, "The label images for this batch are incomplete.");
      }

      const zip = new JSZip();
      const folderName = sanitizeFileSlug(batchSummary.batch_code || batchId, "batch-export");
      const labelsFolder = zip.folder(`${folderName}/labels`);
      const notesFolder = zip.folder(`${folderName}/notes`);

      exportRows.forEach((label) => {
        const exportSvg = buildFactoryLabelSvg({
          productName: batchSummary.product_name,
          batchCode: batchSummary.batch_code,
          qrWebSvg: label.qrWebSvg,
          qr1Svg: label.qr1Svg,
          sequenceNo: label.sequenceNo,
        });
        labelsFolder.file(`${String(label.sequenceNo).padStart(3, "0")}-${sanitizeFileSlug(batchSummary.product_name, "product")}-factory-label.svg`, exportSvg);
      });

      notesFolder.file(
        "printing-guide.txt",
        [
          `Brand: ${batchSummary.brand_name}`,
          `Product: ${batchSummary.product_name}`,
          `Batch code: ${batchSummary.batch_code}`,
          `Created labels: ${exportRows.length}`,
          `Manufacture date: ${batchSummary.manufacture_date || ""}`,
          `Expiry date: ${batchSummary.expiry_date || ""}`,
          "",
          "Package content:",
          "- Factory label SVG files for each issued QR tag.",
          "- Each file includes QR Web Link and QR 1 only.",
          "- Authentication now relies on QR 1 only.",
        ].join("\n"),
      );

      return {
        isValid: true,
        httpStatus: 200,
        fileName: `${folderName}.zip`,
        mimeType: "application/zip",
        buffer: await zip.generateAsync({ type: "nodebuffer" }),
      };
    } catch (error) {
      console.error("Service Error (exportBatchZip):", error);
      return createErrorResult(500, "Unable to export the selected batch right now.");
    }
  },
};

module.exports = brandProductService;
