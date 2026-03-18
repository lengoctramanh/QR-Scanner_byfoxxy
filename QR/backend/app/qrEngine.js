const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { v4: createUUID } = require("uuid");

const SECRET_PREFIX = "QRS";
const SECRET_TOKEN_VERSION = "v1";
const DEFAULT_BCRYPT_ROUNDS = 10;
const DEFAULT_PUBLIC_BYTES = 18;
const DEFAULT_SECRET_BYTES = 24;
const DEFAULT_CONCURRENCY = 8;

const buildSecretToken = (publicToken, secretValue) =>
  `${SECRET_PREFIX}.${SECRET_TOKEN_VERSION}.${publicToken}.${secretValue}`;

const createRandomHex = (byteLength) => crypto.randomBytes(byteLength).toString("hex");

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
});

const buildPrintRow = (pair, index) => ({
  sequenceNo: index + 1,
  qrId: pair.qrId,
  publicToken: pair.publicToken,
  secretToken: pair.secretToken,
  secretFragment: pair.secretValue,
});

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
  async createBulkQrPayload({
    quantity,
    productId,
    batchId,
    requestId = null,
    source = "system_generated",
    effectiveFrom = null,
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
      })
    );

    const printRows = pairs.map((pair, index) => buildPrintRow(pair, index));

    return {
      dbRows,
      printRows,
      bulkInsert: this.buildBulkInsertPayload(dbRows),
    };
  },

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
    ]);

    return {
      columns,
      values,
    };
  },

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
