const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { v4: createUUID } = require("uuid");

const SECRET_PREFIX = "QRS";
const SECRET_TOKEN_VERSION = "v1";
const DEFAULT_BCRYPT_ROUNDS = 10;
const DEFAULT_PUBLIC_BYTES = 18;
const DEFAULT_SECRET_BYTES = 24;
const DEFAULT_CONCURRENCY = 8;

// Ham nay dung de ghep public token va secret value thanh secret token hoan chinh.
// Nhan vao: publicToken va secretValue cua mot QR.
// Tra ve: chuoi secret token theo dinh dang quy uoc.
const buildSecretToken = (publicToken, secretValue) =>
  `${SECRET_PREFIX}.${SECRET_TOKEN_VERSION}.${publicToken}.${secretValue}`;

// Ham nay dung de tao chuoi hex ngau nhien voi so byte chi dinh.
// Nhan vao: byteLength la so byte can sinh.
// Tra ve: chuoi hex ngau nhien.
const createRandomHex = (byteLength) => crypto.randomBytes(byteLength).toString("hex");

// Ham nay dung de chuyen mot cap QR da sinh thanh dong du lieu de ghi vao DB.
// Nhan vao: pair la thong tin mot QR, options chua metadata lien quan den san pham va lo hang.
// Tra ve: object dbRow phuc vu bulk insert.
const buildDbRow = (pair, options) => ({
  qrId: pair.qrId,
  qrPublicToken: pair.publicToken,
  hiddenPinHash: pair.hiddenPinHash,
  source: options.source,
  productId: options.productId,
  batchId: options.batchId,
  requestId: options.requestId,
  status: "NEW",
  effectiveFrom: options.effectiveFrom,
  scanLimit: options.scanLimit,
});

// Ham nay dung de chuyen mot cap QR da sinh thanh dong du lieu de xuat/in.
// Nhan vao: pair la thong tin mot QR, index la vi tri trong lo.
// Tra ve: object printRow de frontend hoac file xuat co the su dung.
const buildPrintRow = (pair, index) => ({
  sequenceNo: index + 1,
  qrId: pair.qrId,
  publicToken: pair.publicToken,
  secretToken: pair.secretToken,
  secretFragment: pair.secretValue,
});

// Ham nay dung de xu ly map bat dong bo voi gioi han so tac vu dong thoi.
// Nhan vao: items la danh sach can xu ly, limit la so worker toi da, mapper la ham xu ly tung phan tu.
// Tra ve: mang ket qua theo dung thu tu ban dau.
const mapWithConcurrency = async (items, limit, mapper) => {
  const safeLimit = Math.max(1, Math.min(limit, items.length || 1));
  const results = new Array(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  };

  await Promise.all(Array.from({ length: safeLimit }, () => worker()));
  return results;
};

// Ham nay dung de dam bao public token va secret token trong mot lo sinh ra khong bi trung.
// Nhan vao: pairs la danh sach cap QR da sinh, generationOptions la cau hinh sinh moi neu gap trung.
// Tra ve: mang cap QR da duoc loai bo trung lap.
const ensureBatchUniqueness = async (pairs, generationOptions) => {
  const seenPublicTokens = new Set();
  const seenSecretTokens = new Set();
  const uniquePairs = [];

  for (const originalPair of pairs) {
    let candidatePair = originalPair;

    while (
      seenPublicTokens.has(candidatePair.publicToken) ||
      seenSecretTokens.has(candidatePair.secretToken)
    ) {
      candidatePair = await generatePair(generationOptions);
    }

    seenPublicTokens.add(candidatePair.publicToken);
    seenSecretTokens.add(candidatePair.secretToken);
    uniquePairs.push(candidatePair);
  }

  return uniquePairs;
};

// Ham nay dung de sinh mot cap QR day du gom qrId, public token, secret token va hash.
// Nhan vao: object cau hinh publicBytes, secretBytes va bcryptRounds.
// Tra ve: object pair da san sang de luu DB va in an.
const generatePair = async ({
  publicBytes = DEFAULT_PUBLIC_BYTES,
  secretBytes = DEFAULT_SECRET_BYTES,
  bcryptRounds = DEFAULT_BCRYPT_ROUNDS,
}) => {
  const qrId = createUUID();
  const publicToken = createRandomHex(publicBytes);
  const secretValue = createRandomHex(secretBytes);
  const secretToken = buildSecretToken(publicToken, secretValue);
  const hiddenPinHash = await bcrypt.hash(secretValue, bcryptRounds);

  return {
    qrId,
    publicToken,
    secretValue,
    secretToken,
    hiddenPinHash,
  };
};

const qrEngine = {
  // Ham nay dung de sinh hang loat du lieu QR va payload bulk insert cho mot san pham/lo hang.
  // Nhan vao: object cau hinh quantity, productId, batchId va cac tuy chon sinh QR.
  // Tra ve: object gom dbRows, printRows va bulkInsert de cac lop khac su dung.
  async createBulkQrPayload({
    quantity,
    productId,
    batchId,
    requestId = null,
    source = "system_generated",
    effectiveFrom = null,
    scanLimit = null,
    bcryptRounds = DEFAULT_BCRYPT_ROUNDS,
    publicBytes = DEFAULT_PUBLIC_BYTES,
    secretBytes = DEFAULT_SECRET_BYTES,
    concurrency = DEFAULT_CONCURRENCY,
  }) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("quantity must be a positive integer");
    }

    if (!productId || !batchId) {
      throw new Error("productId and batchId are required");
    }

    const generationOptions = {
      bcryptRounds,
      publicBytes,
      secretBytes,
    };

    const pairIndexes = Array.from({ length: quantity }, (_, index) => index);
    const generatedPairs = await mapWithConcurrency(
      pairIndexes,
      concurrency,
      async () => generatePair(generationOptions)
    );

    const pairs = await ensureBatchUniqueness(generatedPairs, generationOptions);

    const dbRows = pairs.map((pair) =>
      buildDbRow(pair, {
        source,
        productId,
        batchId,
        requestId,
        effectiveFrom,
        scanLimit,
      })
    );

    const printRows = pairs.map((pair, index) => buildPrintRow(pair, index));

    return {
      dbRows,
      printRows,
      bulkInsert: this.buildBulkInsertPayload(dbRows),
    };
  },

  // Ham nay dung de doi mang dbRows thanh cau truc columns/values cho bulk insert SQL.
  // Nhan vao: dbRows la mang dong du lieu QR can chen.
  // Tra ve: object chua columns va values theo thu tu co dinh.
  buildBulkInsertPayload(dbRows) {
    const columns = [
      "qr_id",
      "qr_public_token",
      "hidden_pin_hash",
      "source",
      "product_id",
      "batch_id",
      "request_id",
      "status",
      "effective_from",
      "scan_limit",
    ];

    const values = dbRows.map((row) => [
      row.qrId,
      row.qrPublicToken,
      row.hiddenPinHash,
      row.source,
      row.productId,
      row.batchId,
      row.requestId,
      row.status,
      row.effectiveFrom,
      row.scanLimit,
    ]);

    return {
      columns,
      values,
    };
  },

  // Ham nay dung de phan tach secret token thanh tung thanh phan nghiep vu.
  // Nhan vao: secretToken la chuoi token can kiem tra.
  // Tra ve: object gom version, publicToken, secretValue hoac null neu token sai dinh dang.
  parseSecretToken(secretToken) {
    if (typeof secretToken !== "string" || !secretToken.trim()) {
      return null;
    }

    const normalizedToken = secretToken.trim();
    const parts = normalizedToken.split(".");

    if (parts.length !== 4) {
      return null;
    }

    const [prefix, version, publicToken, secretValue] = parts;

    if (
      prefix !== SECRET_PREFIX ||
      version !== SECRET_TOKEN_VERSION ||
      !publicToken ||
      !secretValue
    ) {
      return null;
    }

    return {
      version,
      publicToken,
      secretValue,
      secretToken: normalizedToken,
    };
  },
};

module.exports = qrEngine;
