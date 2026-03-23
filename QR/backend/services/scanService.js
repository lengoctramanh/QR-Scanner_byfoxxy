const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { v4: createUUID } = require("uuid");

const db = require("../config/database");
const qrEngine = require("../app/qrEngine");
const { buildProcessedImageTarget, saveScanImage } = require("../app/qrScanStorage");
const { requestQrProcessingCycle, runPythonProcessor } = require("../app/qrProcessingWorker");
const { generateUserQrAssetImage } = require("../app/userQrAssetStorage");
const pictureModel = require("../models/pictureModel");
const guestScanTokenModel = require("../models/guestScanTokenModel");
const qrCodeModel = require("../models/qrCodeModel");
const userModel = require("../models/userModel");
const userQrCollectionModel = require("../models/userQrCollectionModel");
const userScanHistoryModel = require("../models/userScanHistoryModel");
const scanLogModel = require("../models/scanLogModel");
const qrActivationModel = require("../models/qrActivationModel");
const { buildGuestTokenUrl, extractEmbeddedScanPayload } = require("../utils/websiteLinkUtil");

const SESSION_TTL_DAYS = 4;

// Ham nay dung de bam gia tri secret nhap vao truoc khi luu log scan.
// Nhan vao: secretValue la phan bi mat cua secret token.
// Tra ve: chuoi hash SHA-256 dang hex.
const hashHiddenPinInput = (secretValue) =>
  crypto.createHash("sha256").update(secretValue).digest("hex");

// Ham nay dung de bam mot gia tri raw token bat ky bang SHA-256 dang hex.
// Nhan vao: rawValue la chuoi can hash.
// Tra ve: chuoi hash de luu DB va doi chieu an toan.
const hashValue = (rawValue) =>
  crypto.createHash("sha256").update(String(rawValue || "").trim()).digest("hex");

// Ham nay dung de dong goi ket qua service theo chuan httpStatus/body.
// Nhan vao: httpStatus la ma HTTP, body la payload JSON tra ve.
// Tra ve: object gom httpStatus va body.
const createResponse = (httpStatus, body) => ({
  httpStatus,
  body,
});

// Ham nay dung de tao payload co ban cua QR, product, brand va batch tu ban ghi tong hop.
// Nhan vao: qrCode la ban ghi overview lay tu DB.
// Tra ve: object du lieu co ban dung chung cho cac ket qua scan.
const buildBasePayload = (qrCode) => ({
  qr: qrCode
    ? {
        qrId: qrCode.qr_id,
        publicToken: qrCode.qr_public_token,
        status: qrCode.status,
        activatedAt: qrCode.activated_at,
        expiresAt: qrCode.expires_at,
        effectiveFrom: qrCode.effective_from,
        scanLimit: qrCode.scan_limit,
        totalPublicScans: qrCode.total_public_scans,
        totalPinAttempts: qrCode.total_pin_attempts,
      }
    : null,
  product: qrCode
    ? {
        productId: qrCode.product_id,
        productName: qrCode.product_name,
        description: qrCode.description,
        imageUrl: qrCode.image_url,
        generalInfoUrl: qrCode.general_info_url,
        manufacturerName: qrCode.manufacturer_name,
        originCountry: qrCode.origin_country,
        qualityCertifications: qrCode.quality_certifications,
      }
    : null,
  brand: qrCode
    ? {
        brandId: qrCode.brand_id,
        brandName: qrCode.brand_name,
      }
    : null,
      batch: qrCode
    ? {
        batchId: qrCode.batch_id,
        batchCode: qrCode.batch_code,
        manufactureDate: qrCode.manufacture_date,
        expiryDate: qrCode.expiry_date,
      }
    : null,
});

// Ham nay dung de dong goi du lieu log scan truoc khi ghi vao bang scan_global_logs.
// Nhan vao: object chua token da nhap, qrId, loai scan, ket qua scan va scanContext.
// Tra ve: object scan log payload hoan chinh.
const buildScanLogPayload = ({
  qrPublicTokenInput,
  hiddenPinInputHash = null,
  qrId = null,
  batchId = null,
  scanType,
  scanResult,
  scanContext = {},
}) => ({
  logId: createUUID(),
  qrPublicTokenInput,
  hiddenPinInputHash,
  qrId,
  batchId,
  accountId: scanContext.accountId ?? null,
  fingerprintId: scanContext.fingerprintId ?? null,
  scanType,
  scanResult,
  ipAddress: scanContext.ipAddress ?? null,
  location: scanContext.location ?? null,
  deviceInfo: scanContext.deviceInfo ?? null,
});

// Ham nay dung de dong goi thong tin viewer de frontend biet dang scan duoi guest hay signed-in session.
// Nhan vao: scanContext la boi canh scan da duoc controller chuan hoa.
// Tra ve: object viewer metadata cho ket qua scan.
const buildViewerPayload = (scanContext = {}) => {
  const viewerMode = scanContext.authMode || (scanContext.accountId ? "authenticated" : "guest");

  let note = "You are scanning as a guest. Sign in to attach future scans to your account.";

  if (viewerMode === "authenticated" && scanContext.role === "user") {
    note = "This scan is linked to your signed-in account. Your login session stays active for up to 4 days since the latest valid activity.";
  } else if (viewerMode === "authenticated") {
    note = `This scan was recognized under your authenticated ${scanContext.role || "account"} session.`;
  } else if (viewerMode === "expired_session") {
    note = "Your previous login session is missing, revoked, or expired after 4 days. This scan was processed in guest mode.";
  }

  return {
    mode: viewerMode,
    isAuthenticated: Boolean(scanContext.accountId),
    role: scanContext.role || "guest",
    accountId: scanContext.accountId ?? null,
    sessionId: scanContext.sessionId ?? null,
    sessionExpiresAt: scanContext.sessionExpiresAt ?? null,
    sessionTtlDays: SESSION_TTL_DAYS,
    note,
  };
};

// Ham nay dung de ghi mot scan log va tra lai logId vua dung cho cac bang lien ket ca nhan.
// Nhan vao: scanLogArguments la du lieu log can ghi, options co the chua executor.
// Tra ve: logId vua duoc tao trong payload.
const writeScanLog = async (scanLogArguments, options = {}) => {
  const scanLogPayload = buildScanLogPayload(scanLogArguments);
  await scanLogModel.create(scanLogPayload, options);
  return scanLogPayload.logId;
};

// Ham nay dung de tim user_id tu account dang dang nhap nham luu lich su/bo suu tap ca nhan.
// Nhan vao: scanContext va options co the chua executor.
// Tra ve: user_id hoac null neu scan hien tai khong phai user session.
const resolveViewerUserId = async (scanContext = {}, options = {}) => {
  if (scanContext.role !== "user" || !scanContext.accountId) {
    return null;
  }

  const userProfile = await userModel.findByAccountId(scanContext.accountId, options);
  return userProfile?.user_id || null;
};

// Ham nay dung de luu scan vao lich su ca nhan neu nguoi quet dang dang nhap bang user session.
// Nhan vao: scanContext, logId va options transaction tuy chon.
// Tra ve: userId neu lich su duoc lien ket, nguoc lai tra ve null.
const linkScanToUserHistory = async (scanContext = {}, logId, options = {}) => {
  if (!logId) {
    return null;
  }

  const userId = await resolveViewerUserId(scanContext, options);

  if (!userId) {
    return null;
  }

  await userScanHistoryModel.createHistoryEntry(
    {
      userHistoryId: createUUID(),
      userId,
      logId,
    },
    options,
  );

  return userId;
};

// Ham nay dung de them QR da xac thuc vao bo suu tap cua user va chan claim neu ma da co chu.
// Nhan vao: scanContext, qrId, userId da resolve va options transaction tuy chon.
// Tra ve: object mo ta ket qua attach va trang thai ownership hien tai.
const attachQrToUserCollection = async (scanContext = {}, qrId, userId = null, options = {}) => {
  if (!qrId) {
    return {
      attached: false,
      alreadyOwnedByViewer: false,
      ownedByOther: false,
      ownerUserId: null,
    };
  }

  const resolvedUserId = userId || (await resolveViewerUserId(scanContext, options));

  if (!resolvedUserId) {
    return {
      attached: false,
      alreadyOwnedByViewer: false,
      ownedByOther: false,
      ownerUserId: null,
    };
  }

  const existingOwner = await userQrCollectionModel.findOwnerByQrId(qrId, {
    ...options,
    forUpdate: Boolean(options.executor),
  });

  if (existingOwner?.user_id && existingOwner.user_id !== resolvedUserId) {
    return {
      attached: false,
      alreadyOwnedByViewer: false,
      ownedByOther: true,
      ownerUserId: existingOwner.user_id,
    };
  }

  if (existingOwner?.user_id === resolvedUserId) {
    return {
      attached: false,
      alreadyOwnedByViewer: true,
      ownedByOther: false,
      ownerUserId: resolvedUserId,
    };
  }

  const attached = await userQrCollectionModel.addCollection(
    {
      collectionId: createUUID(),
      userId: resolvedUserId,
      qrId,
    },
    options,
  );

  return {
    attached,
    alreadyOwnedByViewer: false,
    ownedByOther: false,
    ownerUserId: resolvedUserId,
  };
};

// Ham nay dung de kiem tra nhanh ma QR hien tai da co chu so huu trong he thong hay chua.
// Nhan vao: scanContext, qrId va options transaction tuy chon.
// Tra ve: object ownership state de service quyet dinh co cho claim hay khong.
const inspectQrOwnership = async (scanContext = {}, qrId, options = {}) => {
  if (!qrId) {
    return {
      hasOwner: false,
      alreadyOwnedByViewer: false,
      ownedByOther: false,
      ownerUserId: null,
      viewerUserId: null,
    };
  }

  const viewerUserId = await resolveViewerUserId(scanContext, options);
  const ownerRecord = await userQrCollectionModel.findOwnerByQrId(qrId, {
    ...options,
    forUpdate: Boolean(options.executor),
  });

  if (!ownerRecord?.user_id) {
    return {
      hasOwner: false,
      alreadyOwnedByViewer: false,
      ownedByOther: false,
      ownerUserId: null,
      viewerUserId,
    };
  }

  return {
    hasOwner: true,
    alreadyOwnedByViewer: Boolean(viewerUserId) && ownerRecord.user_id === viewerUserId,
    ownedByOther: Boolean(viewerUserId) && ownerRecord.user_id !== viewerUserId,
    ownerUserId: ownerRecord.user_id,
    viewerUserId,
  };
};

// Ham nay dung de kiem tra viewer hien tai co phai guest mode can duoc cap guest token hay khong.
// Nhan vao: scanContext la boi canh scan da duoc controller chuan hoa.
// Tra ve: true neu scan dang o guest/expired session, nguoc lai la false.
const shouldIssueGuestToken = (scanContext = {}) => {
  const viewerMode = scanContext.authMode || (scanContext.accountId ? "authenticated" : "guest");
  return viewerMode !== "authenticated";
};

// Ham nay dung de dong goi snapshot goc cua mot ket qua scan de luu lai cho guest token.
// Nhan vao: body la payload JSON sap tra ve client.
// Tra ve: chuoi JSON snapshot co the phuc hoi lai ve sau.
const serializeResultSnapshot = (body = {}) =>
  JSON.stringify({
    success: body.success !== false,
    verdict: body.verdict || "",
    code: body.code || "",
    message: body.message || "",
    data: body.data || {},
  });

// Ham nay dung de parse snapshot guest token da luu trong DB tro lai object JSON.
// Nhan vao: tokenRow la ban ghi guest_scan_tokens.
// Tra ve: object snapshot hop le hoac null neu parse that bai.
const parseGuestTokenSnapshot = (tokenRow) => {
  if (!tokenRow?.result_snapshot_json) {
    return null;
  }

  try {
    const snapshotValue =
      typeof tokenRow.result_snapshot_json === "string"
        ? JSON.parse(tokenRow.result_snapshot_json)
        : tokenRow.result_snapshot_json;

    if (snapshotValue && typeof snapshotValue === "object") {
      return snapshotValue;
    }
  } catch (error) {
    console.error("Service Error (parseGuestTokenSnapshot):", error);
  }

  return null;
};

// Ham nay dung de tao metadata guest token de gui ve frontend sau mot lan guest scan.
// Nhan vao: body la payload ket qua, rawQrContent la chuoi guest vua quet va entity ids la mapping DB.
// Tra ve: object guestToken metadata hoac null neu khong the tao.
const createGuestTokenPayload = async ({
  body,
  rawQrContent,
  qrId = null,
  batchId = null,
  sourceLogId = null,
  options = {},
}) => {
  const rawGuestToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashValue(rawGuestToken);
  const claimUrl = await buildGuestTokenUrl(rawGuestToken);
  const productName =
    body?.data?.product?.productName ||
    body?.data?.brand?.brandName ||
    body?.data?.batch?.batchCode ||
    "guest-scan";
  const qrAsset = await generateUserQrAssetImage({
    content: claimUrl,
    userName: "guest",
    productName,
    assetType: "guest-token-qr",
    entityKey: sourceLogId || qrId || batchId || "guest-token",
  });

  await guestScanTokenModel.createToken(
    {
      guestTokenId: createUUID(),
      tokenHash,
      qrId,
      batchId,
      sourceLogId,
      scanVerdict: body?.verdict || "UNKNOWN",
      responseCode: body?.code || null,
      responseMessage: body?.message || null,
      resultSnapshotJson: serializeResultSnapshot(body),
      claimUrl,
      qrFileName: qrAsset.fileName,
      qrStoragePath: qrAsset.filePath,
      qrPublicUrl: qrAsset.publicUrl,
    },
    options,
  );

  return {
    claimUrl,
    qrImageUrl: qrAsset.publicUrl,
    message:
      "Guest token ready. Save or rescan this QR later to reopen the same result or claim it after signing in.",
  };
};

// Ham nay dung de chen guest token metadata vao payload scan danh cho guest/expired viewer.
// Nhan vao: body la payload sap tra, scanContext la boi canh scan va args phuc vu tao token.
// Tra ve: chinh body goc sau khi da them data.guestToken neu phu hop.
const enrichGuestResponse = async (body, scanContext = {}, guestTokenArguments = null, options = {}) => {
  if (!body?.success || !shouldIssueGuestToken(scanContext) || !guestTokenArguments) {
    return body;
  }

  const guestTokenPayload = await createGuestTokenPayload({
    body,
    ...guestTokenArguments,
    options,
  });
  return {
    ...body,
    data: {
      ...(body.data || {}),
      guestToken: guestTokenPayload,
    },
  };
};

// Ham nay dung de quy doi trang thai QR thanh ket qua log cua public scan.
// Nhan vao: status la trang thai hien tai cua QR trong DB.
// Tra ve: chuoi scanResult phu hop voi nghiep vu.
const resolvePublicScanResult = (status) => {
  switch (status) {
    case "NEW":
      return "INFO_SHOWN";
    case "ACTIVATED":
      return "SUSPICIOUS";
    case "SUSPICIOUS":
      return "SUSPICIOUS";
    case "BLOCKED":
      return "BLOCKED";
    case "EXPIRED":
      return "EXPIRED";
    default:
      return "FAKE";
  }
};

// Ham nay dung de quy doi verdict tra ve cho frontend thanh scan_result phu hop voi scan_global_logs.
// Nhan vao: verdict la ket qua nghiep vu hop nhat sau khi scan.
// Tra ve: gia tri enum scan_result dung cho viec ghi log.
const mapVerdictToScanResult = (verdict) => {
  switch (verdict) {
    case "INFO":
      return "INFO_SHOWN";
    case "GENUINE":
    case "INTACT":
      return "VALID";
    case "BLOCKED":
      return "BLOCKED";
    case "EXPIRED":
      return "EXPIRED";
    case "FAKE":
      return "FAKE";
    case "OWNED":
      return "OWNED";
    default:
      return "SUSPICIOUS";
  }
};

// Ham nay dung de kiem tra lan scan secret hien tai co cung actor voi lan kich hoat dau tien hay khong.
// Nhan vao: activationRecord la ban ghi kich hoat, scanContext la boi canh scan hien tai.
// Tra ve: boolean cho biet co phai cung tai khoan hoac fingerprint hay khong.
const isSameActivationActor = (activationRecord, scanContext) => {
  if (!activationRecord) {
    return false;
  }

  const matchedAccount =
    activationRecord.activated_by_account_id &&
    scanContext.accountId &&
    activationRecord.activated_by_account_id === scanContext.accountId;

  const matchedFingerprint =
    activationRecord.activated_by_fingerprint_id &&
    scanContext.fingerprintId &&
    activationRecord.activated_by_fingerprint_id === scanContext.fingerprintId;

  return Boolean(matchedAccount || matchedFingerprint);
};

// Ham nay dung de tao business payload thong nhat cho ket qua quet QR.
// Nhan vao: object chua verdict, code, message, qrCode va extraData.
// Tra ve: body JSON chuan de tra ve cho controller.
const createBusinessBody = ({ verdict, code, message, qrCode, scanContext = {}, extraData = {} }) => ({
  success: true,
  verdict,
  code,
  message,
  data: {
    ...buildBasePayload(qrCode),
    viewer: buildViewerPayload(scanContext),
    ...extraData,
  },
});

// Ham nay dung de lay noi dung QR dau tien ma Python/OpenCV giai ma duoc.
// Nhan vao: pythonResult la payload stdout cua process_qr_image.py.
// Tra ve: chuoi QR dau tien hoac chuoi rong neu khong tim thay.
const pickDecodedQrText = (pythonResult) => {
  const decodedTexts = Array.isArray(pythonResult?.decodedTexts) ? pythonResult.decodedTexts : [];
  return decodedTexts.find((entry) => typeof entry === "string" && entry.trim())?.trim() || "";
};

// Ham nay dung de tao response loi validate dau vao.
// Nhan vao: message la noi dung loi can tra ve.
// Tra ve: object response gom ma 400 va payload loi.
const createValidationError = (message) =>
  createResponse(400, {
    success: false,
    message,
  });

// Ham nay dung de tao payload thong bao ma QR da co user khac so huu va khong the claim them.
// Nhan vao: qrCode la overview cua QR va scanContext la boi canh scan hien tai.
// Tra ve: body JSON giu lai thong tin san pham nhung doi verdict sang SUSPICIOUS.
const createOwnershipBlockedBody = ({ qrCode, scanContext = {}, code = "QR_ALREADY_OWNED_BY_OTHER_USER" }) =>
  createBusinessBody({
    verdict: "SUSPICIOUS",
    code,
    message:
      "Ma xac thuc nay da duoc mot user khac so huu. Neu ma nay xuat hien tren san pham cua ban, day la dau hieu ma da bi sao chep hoac hang gia.",
    qrCode,
    extraData: {
      scanLayer: "QR_1",
      ownership: {
        claimAllowed: false,
      },
    },
    scanContext,
  });

const scanService = {
  // Ham nay dung de xu ly public scan, ghi log va tra danh gia tinh trang QR.
  // Nhan vao: publicToken va scanContext chua metadata nguoi quet.
  // Tra ve: object response nghiep vu voi httpStatus va body de controller tra ve client.
  async handlePublicScan(publicToken, scanContext = {}) {
    const normalizedToken =
      typeof publicToken === "string" ? publicToken.trim() : "";

    if (!normalizedToken) {
      return createValidationError("public token is required");
    }

    try {
      const qrCode = await qrCodeModel.findOverviewByPublicToken(normalizedToken);

      if (!qrCode) {
        const logId = await writeScanLog({
          qrPublicTokenInput: normalizedToken,
          scanType: "PUBLIC_SCAN",
          scanResult: "FAKE",
          scanContext,
        });
        await linkScanToUserHistory(scanContext, logId);

        const responseBody = createBusinessBody({
          verdict: "FAKE",
          code: "PUBLIC_TOKEN_NOT_FOUND",
          message:
            "Khong tim thay ma QR cong khai trong he thong. Day la dau hieu hang gia hoac ma da bi sao chep sai.",
          qrCode: null,
          extraData: {
            qr: {
              qrId: null,
              publicToken: normalizedToken,
              status: null,
            },
          },
          scanContext,
        });

        return createResponse(
          200,
          await enrichGuestResponse(
            responseBody,
            scanContext,
            {
              rawQrContent: normalizedToken,
              sourceLogId: logId,
            },
          ),
        );
      }

      await qrCodeModel.incrementPublicScanCount(qrCode.qr_id);
      qrCode.total_public_scans += 1;

      const scanResult = resolvePublicScanResult(qrCode.status);

      const logId = await writeScanLog({
        qrPublicTokenInput: normalizedToken,
        qrId: qrCode.qr_id,
        batchId: qrCode.batch_id,
        scanType: "PUBLIC_SCAN",
        scanResult,
        scanContext,
      });
      await linkScanToUserHistory(scanContext, logId);
      const guestTokenArguments = {
        rawQrContent: normalizedToken,
        qrId: qrCode.qr_id,
        batchId: qrCode.batch_id,
        sourceLogId: logId,
      };

      switch (qrCode.status) {
        case "NEW": {
          const responseBody = createBusinessBody({
            verdict: "INTACT",
            code: "PRODUCT_INTACT",
            message:
              "San pham con nguyen ven. Hay boc tem QR secret de xac thuc hang chinh hang.",
            qrCode,
            scanContext,
          });

          return createResponse(200, await enrichGuestResponse(responseBody, scanContext, guestTokenArguments));
        }

        case "ACTIVATED": {
          const responseBody = createBusinessBody({
            verdict: "SUSPICIOUS",
            code: "PUBLIC_CODE_ALREADY_ACTIVATED",
            message:
              "CANH BAO HANG GIA! Ma public nay da bi boc va kich hoat truoc do.",
            qrCode,
            scanContext,
          });

          return createResponse(200, await enrichGuestResponse(responseBody, scanContext, guestTokenArguments));
        }

        case "SUSPICIOUS": {
          const responseBody = createBusinessBody({
            verdict: "SUSPICIOUS",
            code: "PUBLIC_CODE_SUSPICIOUS",
            message:
              "Ma QR nay dang bi danh dau bat thuong. Khong nen tiep tuc giao dich truoc khi duoc kiem tra them.",
            qrCode,
            scanContext,
          });

          return createResponse(200, await enrichGuestResponse(responseBody, scanContext, guestTokenArguments));
        }

        case "BLOCKED": {
          const responseBody = createBusinessBody({
            verdict: "BLOCKED",
            code: "PUBLIC_CODE_BLOCKED",
            message: "Ma QR nay da bi khoa boi he thong hoac quan tri vien.",
            qrCode,
            scanContext,
          });

          return createResponse(200, await enrichGuestResponse(responseBody, scanContext, guestTokenArguments));
        }

        case "EXPIRED": {
          const responseBody = createBusinessBody({
            verdict: "EXPIRED",
            code: "PUBLIC_CODE_EXPIRED",
            message: "Ma QR nay da het han xac thuc hoac bao hanh.",
            qrCode,
            scanContext,
          });

          return createResponse(200, await enrichGuestResponse(responseBody, scanContext, guestTokenArguments));
        }

        default: {
          const responseBody = createBusinessBody({
            verdict: "SUSPICIOUS",
            code: "PUBLIC_CODE_UNKNOWN_STATE",
            message:
              "Ma QR dang o trang thai khong xac dinh. Can chuyen cho bo phan van hanh kiem tra.",
            qrCode,
            scanContext,
          });

          return createResponse(200, await enrichGuestResponse(responseBody, scanContext, guestTokenArguments));
        }
      }
    } catch (error) {
      console.error("Service Error (handlePublicScan):", error);
      throw error;
    }
  },

  // Ham nay dung de xu ly secret scan, kich hoat QR neu hop le va ghi toan bo log/activation vao DB.
  // Nhan vao: secretToken va scanContext chua metadata nguoi quet.
  // Tra ve: object response nghiep vu sau khi xac thuc secret token.
  async handleSecretScan(secretToken, scanContext = {}) {
    const parsedSecretToken = qrEngine.parseSecretToken(secretToken);

    if (!parsedSecretToken) {
      return createValidationError("secretToken is invalid");
    }

    const hiddenPinInputHash = hashHiddenPinInput(parsedSecretToken.secretValue);
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const qrCode = await qrCodeModel.findOverviewByPublicToken(
        parsedSecretToken.publicToken,
        {
          executor: connection,
          forUpdate: true,
        }
      );

      if (!qrCode) {
        const logId = await writeScanLog(
          {
            qrPublicTokenInput: parsedSecretToken.publicToken,
            hiddenPinInputHash,
            scanType: "PIN_VERIFICATION",
            scanResult: "FAKE",
            scanContext,
          },
          { executor: connection },
        );
        await linkScanToUserHistory(scanContext, logId, { executor: connection });

        await connection.commit();

        const responseBody = createBusinessBody({
          verdict: "FAKE",
          code: "SECRET_TOKEN_NOT_FOUND",
          message:
            "Secret token khong khop voi bat ky ma QR nao trong he thong. Day la dau hieu hang gia.",
          qrCode: null,
          extraData: {
            scanLayer: "QR_1",
            qr: {
              qrId: null,
              publicToken: parsedSecretToken.publicToken,
              status: null,
            },
          },
          scanContext,
        });

        return createResponse(
          200,
          await enrichGuestResponse(
            responseBody,
            scanContext,
            {
              rawQrContent: secretToken,
              sourceLogId: logId,
            },
            { executor: connection },
          ),
        );
      }

      await qrCodeModel.incrementPinAttemptCount(qrCode.qr_id, {
        executor: connection,
      });
      qrCode.total_pin_attempts += 1;

      if (qrCode.status === "BLOCKED") {
        const logId = await writeScanLog(
          {
            qrPublicTokenInput: parsedSecretToken.publicToken,
            hiddenPinInputHash,
            qrId: qrCode.qr_id,
            batchId: qrCode.batch_id,
            scanType: "PIN_VERIFICATION",
            scanResult: "BLOCKED",
            scanContext,
          },
          { executor: connection },
        );
        await linkScanToUserHistory(scanContext, logId, { executor: connection });

        await connection.commit();

        const responseBody = createBusinessBody({
          verdict: "BLOCKED",
          code: "SECRET_CODE_BLOCKED",
          message: "Ma secret nay da bi khoa, khong the tiep tuc xac thuc.",
          qrCode,
          extraData: {
            scanLayer: "QR_1",
          },
          scanContext,
        });

        return createResponse(
          200,
          await enrichGuestResponse(
            responseBody,
            scanContext,
            {
              rawQrContent: secretToken,
              qrId: qrCode.qr_id,
              batchId: qrCode.batch_id,
              sourceLogId: logId,
            },
            { executor: connection },
          ),
        );
      }

      if (qrCode.status === "EXPIRED") {
        const logId = await writeScanLog(
          {
            qrPublicTokenInput: parsedSecretToken.publicToken,
            hiddenPinInputHash,
            qrId: qrCode.qr_id,
            batchId: qrCode.batch_id,
            scanType: "PIN_VERIFICATION",
            scanResult: "EXPIRED",
            scanContext,
          },
          { executor: connection },
        );
        await linkScanToUserHistory(scanContext, logId, { executor: connection });

        await connection.commit();

        const responseBody = createBusinessBody({
          verdict: "EXPIRED",
          code: "SECRET_CODE_EXPIRED",
          message: "Ma secret nay da het han xac thuc hoac bao hanh.",
          qrCode,
          extraData: {
            scanLayer: "QR_1",
          },
          scanContext,
        });

        return createResponse(
          200,
          await enrichGuestResponse(
            responseBody,
            scanContext,
            {
              rawQrContent: secretToken,
              qrId: qrCode.qr_id,
              batchId: qrCode.batch_id,
              sourceLogId: logId,
            },
            { executor: connection },
          ),
        );
      }

      const isSecretMatched = await bcrypt.compare(
        parsedSecretToken.secretValue,
        qrCode.hidden_pin_hash
      );

      if (!isSecretMatched) {
        const logId = await writeScanLog(
          {
            qrPublicTokenInput: parsedSecretToken.publicToken,
            hiddenPinInputHash,
            qrId: qrCode.qr_id,
            batchId: qrCode.batch_id,
            scanType: "PIN_VERIFICATION",
            scanResult: "FAKE",
            scanContext,
          },
          { executor: connection },
        );
        await linkScanToUserHistory(scanContext, logId, { executor: connection });

        await connection.commit();

        const responseBody = createBusinessBody({
          verdict: "FAKE",
          code: "SECRET_CODE_INVALID",
          message:
            "Secret token khong hop le. San pham co dau hieu bi gia mao hoac bi can thiep.",
          qrCode,
          extraData: {
            scanLayer: "QR_1",
          },
          scanContext,
        });

        return createResponse(
          200,
          await enrichGuestResponse(
            responseBody,
            scanContext,
            {
              rawQrContent: secretToken,
              qrId: qrCode.qr_id,
              batchId: qrCode.batch_id,
              sourceLogId: logId,
            },
            { executor: connection },
          ),
        );
      }

      if (qrCode.status === "NEW") {
        await qrCodeModel.activateQrCode(qrCode.qr_id, {
          executor: connection,
        });

        await qrActivationModel.create(
          {
            activationId: createUUID(),
            qrId: qrCode.qr_id,
            activatedByAccountId: scanContext.accountId,
            activatedByFingerprintId: scanContext.fingerprintId,
            activationIp: scanContext.ipAddress,
          },
          { executor: connection }
        );

        const logId = await writeScanLog(
          {
            qrPublicTokenInput: parsedSecretToken.publicToken,
            hiddenPinInputHash,
            qrId: qrCode.qr_id,
            batchId: qrCode.batch_id,
            scanType: "PIN_VERIFICATION",
            scanResult: "VALID",
            scanContext,
          },
          { executor: connection },
        );
        const userId = await linkScanToUserHistory(scanContext, logId, { executor: connection });

        const activatedQrCode = await qrCodeModel.findOverviewByPublicToken(
          parsedSecretToken.publicToken,
          {
            executor: connection,
          }
        );
        const attachResult = await attachQrToUserCollection(scanContext, qrCode.qr_id, userId, {
          executor: connection,
        });

        await connection.commit();

        if (attachResult.ownedByOther) {
          return createResponse(
            200,
            createOwnershipBlockedBody({
              qrCode: activatedQrCode || qrCode,
              scanContext,
              code: "SECRET_CODE_OWNED_BY_OTHER_USER",
            }),
          );
        }

        const responseBody = createBusinessBody({
          verdict: "GENUINE",
          code: "SECRET_CODE_ACTIVATED",
          message:
            "Hang chinh hang. Secret token hop le va ma public da duoc khoa cheo thanh cong.",
          qrCode: activatedQrCode || qrCode,
          extraData: {
            scanLayer: "QR_1",
            activation: {
              activatedAt: activatedQrCode?.activated_at || new Date().toISOString(),
            },
            ownership: {
              claimAllowed: true,
              claimedNow: attachResult.attached,
              alreadyOwnedByViewer: attachResult.alreadyOwnedByViewer,
            },
          },
          scanContext,
        });

        return createResponse(
          200,
          await enrichGuestResponse(
            responseBody,
            scanContext,
            {
              rawQrContent: secretToken,
              qrId: qrCode.qr_id,
              batchId: qrCode.batch_id,
              sourceLogId: logId,
            },
          ),
        );
      }

      const activationRecord = await qrActivationModel.findByQrId(qrCode.qr_id, {
        executor: connection,
      });

      if (qrCode.status === "ACTIVATED") {
        const ownershipState = await inspectQrOwnership(scanContext, qrCode.qr_id, {
          executor: connection,
        });
        const trustedRescan =
          isSameActivationActor(activationRecord, scanContext) ||
          ownershipState.alreadyOwnedByViewer;
        const scanResult = ownershipState.ownedByOther ? "OWNED" : trustedRescan ? "VALID" : "SUSPICIOUS";

        const logId = await writeScanLog(
          {
            qrPublicTokenInput: parsedSecretToken.publicToken,
            hiddenPinInputHash,
            qrId: qrCode.qr_id,
            batchId: qrCode.batch_id,
            scanType: "PIN_VERIFICATION",
            scanResult,
            scanContext,
          },
          { executor: connection },
        );
        const userId = await linkScanToUserHistory(scanContext, logId, { executor: connection });
        let attachResult = {
          attached: false,
          alreadyOwnedByViewer: ownershipState.alreadyOwnedByViewer,
          ownedByOther: ownershipState.ownedByOther,
        };

        if (trustedRescan) {
          attachResult = await attachQrToUserCollection(scanContext, qrCode.qr_id, userId, {
            executor: connection,
          });
        }

        await connection.commit();

        if (ownershipState.ownedByOther || attachResult.ownedByOther) {
          return createResponse(
            200,
            createOwnershipBlockedBody({
              qrCode,
              scanContext,
              code: "SECRET_CODE_ALREADY_BOUND_TO_OTHER_USER",
            }),
          );
        }

        if (trustedRescan) {
          const responseBody = createBusinessBody({
            verdict: "SUSPICIOUS",
            code: "SECRET_CODE_ALREADY_OWNED_BY_VIEWER",
            message:
              "Ma xac thuc nay da duoc so huu boi tai khoan cua ban tu truoc. Neu ma nay xuat hien tren mot san pham khac, kha nang cao la ma da bi sao chep.",
            qrCode,
            extraData: {
              scanLayer: "QR_1",
              activation: {
                activatedAt: activationRecord ? activationRecord.activated_at : qrCode.activated_at,
              },
              ownership: {
                claimAllowed: true,
                claimedNow: attachResult.attached,
                alreadyOwnedByViewer: attachResult.alreadyOwnedByViewer,
              },
            },
            scanContext,
          });

          return createResponse(
            200,
            await enrichGuestResponse(
              responseBody,
              scanContext,
              {
                rawQrContent: secretToken,
                qrId: qrCode.qr_id,
                batchId: qrCode.batch_id,
                sourceLogId: logId,
              },
          ),
        );
      }

      const responseBody = createBusinessBody({
        verdict: "SUSPICIOUS",
          code: "SECRET_CODE_REUSED_ON_OTHER_ACTOR",
          message:
            "Secret token dung nhung ma nay da duoc kich hoat truoc do o mot thiet bi hoac tai khoan khac. Can dieu tra kha nang hang gia.",
          qrCode,
          extraData: {
            scanLayer: "QR_1",
            activation: {
              activatedAt: activationRecord ? activationRecord.activated_at : qrCode.activated_at,
            },
          },
          scanContext,
        });

        return createResponse(
          200,
          await enrichGuestResponse(
            responseBody,
            scanContext,
            {
              rawQrContent: secretToken,
              qrId: qrCode.qr_id,
              batchId: qrCode.batch_id,
              sourceLogId: logId,
            },
          ),
        );
      }

      const logId = await writeScanLog(
        {
          qrPublicTokenInput: parsedSecretToken.publicToken,
          hiddenPinInputHash,
          qrId: qrCode.qr_id,
          batchId: qrCode.batch_id,
          scanType: "PIN_VERIFICATION",
          scanResult: "SUSPICIOUS",
          scanContext,
        },
        { executor: connection },
      );
      await linkScanToUserHistory(scanContext, logId, { executor: connection });

      await connection.commit();

      const responseBody = createBusinessBody({
        verdict: "SUSPICIOUS",
        code: "SECRET_CODE_SUSPICIOUS",
        message:
          "Ma secret hop le nhung QR nay dang bi danh dau bat thuong. Can chuyen sang xu ly thu cong.",
        qrCode,
        extraData: {
          scanLayer: "QR_1",
        },
        scanContext,
      });

      return createResponse(
        200,
        await enrichGuestResponse(
          responseBody,
          scanContext,
          {
            rawQrContent: secretToken,
            qrId: qrCode.qr_id,
            batchId: qrCode.batch_id,
            sourceLogId: logId,
          },
        ),
      );
    } catch (error) {
      await connection.rollback();
      console.error("Service Error (handleSecretScan):", error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Ham nay dung de xu ly QR guest token: mo lai ket qua cu va claim ma cho user neu token map den qr_id.
  // Nhan vao: guestToken la token raw trong URL/QR va rawGuestUrl la noi dung URL da scan duoc.
  // Tra ve: object response nghiep vu sau khi phuc hoi snapshot va xu ly claim neu can.
  async handleGuestTokenScan(guestToken, rawGuestUrl, scanContext = {}) {
    const normalizedGuestToken = typeof guestToken === "string" ? guestToken.trim() : "";

    if (!normalizedGuestToken) {
      return createValidationError("guest token is required");
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const tokenRow = await guestScanTokenModel.findByTokenHash(hashValue(normalizedGuestToken), {
        executor: connection,
        forUpdate: true,
      });

      if (!tokenRow) {
        const logId = await writeScanLog(
          {
            qrPublicTokenInput: rawGuestUrl || normalizedGuestToken,
            scanType: "TOKEN_SCAN",
            scanResult: "FAKE",
            scanContext,
          },
          { executor: connection },
        );
        await linkScanToUserHistory(scanContext, logId, { executor: connection });
        await connection.commit();

        return createResponse(200, {
          success: true,
          verdict: "FAKE",
          code: "GUEST_TOKEN_NOT_FOUND",
          message: "This guest token is invalid or no longer exists in the system.",
          data: {
            qr: null,
            product: null,
            brand: null,
            batch: null,
            viewer: buildViewerPayload(scanContext),
          },
        });
      }

      const snapshot = parseGuestTokenSnapshot(tokenRow) || {
        success: true,
        verdict: tokenRow.scan_verdict || "FAKE",
        code: tokenRow.response_code || "GUEST_TOKEN_RESTORED",
        message: tokenRow.response_message || "The guest token result was restored successfully.",
        data: {},
      };

      const baseBody = {
        success: true,
        verdict: snapshot.verdict || tokenRow.scan_verdict || "FAKE",
        code: snapshot.code || tokenRow.response_code || "GUEST_TOKEN_RESTORED",
        message: snapshot.message || tokenRow.response_message || "The guest token result was restored successfully.",
        data: {
          ...(snapshot.data || {}),
          viewer: buildViewerPayload(scanContext),
          guestToken: {
            claimUrl: tokenRow.claim_url,
            qrImageUrl: tokenRow.qr_public_url,
            message: "This token restores the same QR result across devices and can be claimed after sign-in.",
          },
        },
      };

      let responseBody = baseBody;
      let scanResult = mapVerdictToScanResult(baseBody.verdict);
      const viewerUserId = await resolveViewerUserId(scanContext, { executor: connection });

      if (viewerUserId && tokenRow.qr_id) {
        const attachResult = await attachQrToUserCollection(scanContext, tokenRow.qr_id, viewerUserId, {
          executor: connection,
        });

        if (attachResult.ownedByOther) {
          responseBody = {
            ...baseBody,
            verdict: "SUSPICIOUS",
            code: "GUEST_TOKEN_ALREADY_CLAIMED_BY_OTHER_USER",
            message:
              "Token nay tro toi mot ma xac thuc da duoc user khac so huu. Day la dau hieu ma da bi sao chep hoac khong con hop le de claim.",
            data: {
              ...(baseBody.data || {}),
              ownership: {
                claimAllowed: false,
                claimedNow: false,
                alreadyOwnedByViewer: false,
                ownedByOther: true,
              },
            },
          };
          scanResult = "SUSPICIOUS";
        } else {
          responseBody = {
            ...baseBody,
            data: {
              ...(baseBody.data || {}),
              ownership: {
                claimAllowed: true,
                claimedNow: attachResult.attached,
                alreadyOwnedByViewer: attachResult.alreadyOwnedByViewer,
                ownedByOther: false,
              },
            },
          };
          scanResult = mapVerdictToScanResult(baseBody.verdict);
        }

        await guestScanTokenModel.touchToken(
          tokenRow.guest_token_id,
          {
            claimedByUserId: attachResult.ownedByOther ? null : viewerUserId,
          },
          { executor: connection },
        );
      } else {
        await guestScanTokenModel.touchToken(tokenRow.guest_token_id, {}, { executor: connection });
      }

      const logId = await writeScanLog(
        {
          qrPublicTokenInput: rawGuestUrl || tokenRow.claim_url || normalizedGuestToken,
          qrId: tokenRow.qr_id,
          batchId: tokenRow.batch_id,
          scanType: "TOKEN_SCAN",
          scanResult,
          scanContext,
        },
        { executor: connection },
      );
      await linkScanToUserHistory(scanContext, logId, { executor: connection });

      await connection.commit();
      return createResponse(200, responseBody);
    } catch (error) {
      await connection.rollback();
      console.error("Service Error (handleGuestTokenScan):", error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Ham nay dung de tu dong nhan dien loai QR va dieu huong sang nghiep vu scan phu hop.
  // Nhan vao: rawQrContent la noi dung QR goc va scanContext la metadata nguoi quet.
  // Tra ve: ket qua tu guest-token, QR 1 xac thuc hoac public token tuy theo loai duoc nhan dien.
  async resolveScanContent(rawQrContent, scanContext = {}) {
    const normalizedQrContent =
      typeof rawQrContent === "string" ? rawQrContent.trim() : "";

    if (!normalizedQrContent) {
      return createValidationError("QR content is required.");
    }

    const embeddedPayload = extractEmbeddedScanPayload(normalizedQrContent);

    if (embeddedPayload.guestToken) {
      return this.handleGuestTokenScan(embeddedPayload.guestToken, embeddedPayload.normalizedUrl, scanContext);
    }

    let effectiveQrContent = embeddedPayload.scanTarget
      ? embeddedPayload.scanTarget.trim()
      : normalizedQrContent;

    const nestedEmbeddedPayload = extractEmbeddedScanPayload(effectiveQrContent);

    if (nestedEmbeddedPayload.guestToken) {
      return this.handleGuestTokenScan(nestedEmbeddedPayload.guestToken, nestedEmbeddedPayload.normalizedUrl, scanContext);
    }

    if (nestedEmbeddedPayload.scanTarget) {
      effectiveQrContent = nestedEmbeddedPayload.scanTarget.trim();
    }

    if (qrEngine.parseSecretToken(effectiveQrContent)) {
      return this.handleSecretScan(effectiveQrContent, scanContext);
    }

    return this.handlePublicScan(effectiveQrContent, scanContext);
  },

  // Ham nay dung de upload anh, cho backend tu giai ma QR bang Python/OpenCV va xu ly ket qua scan ngay.
  // Nhan vao: file anh, source camera/gallery va scanContext da chuan hoa tu request.
  // Tra ve: object response gom ket qua scan va metadata anh da luu/xu ly.
  async resolveImage(file, source = "camera", scanContext = {}) {
    if (!file) {
      return createValidationError("Image file is required.");
    }

    if (!String(file.mimetype || "").toLowerCase().startsWith("image/")) {
      return createValidationError("Only image uploads are supported.");
    }

    const pictureId = createUUID();
    const storedImage = saveScanImage({ file, source });
    const processedImageTarget = buildProcessedImageTarget(pictureId, ".png");

    try {
      await pictureModel.createScanPicture({
        pictureId,
        pictureGroup: "QR_SCAN",
        captureSource: storedImage.source,
        originalFileName: storedImage.fileName,
        originalMimeType: file.mimetype,
        originalStoragePath: storedImage.relativeStoragePath,
        originalPublicUrl: storedImage.publicUrl,
        processedFileName: processedImageTarget.fileName,
        processedStoragePath: processedImageTarget.relativeStoragePath,
        processedPublicUrl: processedImageTarget.publicUrl,
        processingStatus: "PENDING",
        processingNote: "Waiting for synchronous QR resolution.",
      });

      await pictureModel.markPictureAsProcessing(
        pictureId,
        "The backend is decoding this QR image immediately.",
      );

      const pythonResult = await runPythonProcessor(
        storedImage.absolutePath,
        processedImageTarget.absolutePath,
      );

      await pictureModel.markPictureAsProcessed(pictureId, {
        processedFileName: processedImageTarget.fileName,
        processedStoragePath: processedImageTarget.relativeStoragePath,
        processedPublicUrl: processedImageTarget.publicUrl,
        processingStatus: "PROCESSED",
        processingNote:
          pythonResult.message || "The QR image was decoded and processed successfully.",
      });

      const decodedQrText = pickDecodedQrText(pythonResult);
      const scanImageJob = {
        pictureId,
        captureSource: storedImage.source,
        imageUrl: storedImage.publicUrl,
        processedImageUrl: processedImageTarget.publicUrl,
        processingStatus: "PROCESSED",
        processingNote: pythonResult.message || "The QR image was decoded and processed successfully.",
      };

      const resolvedScan = decodedQrText
        ? await this.resolveScanContent(decodedQrText, scanContext)
        : null;

      if (!resolvedScan) {
        return createResponse(200, {
          success: false,
          message: "Please scan a valid QR code.",
          data: {
            scanImageJob,
          },
        });
      }

      return createResponse(resolvedScan.httpStatus, {
        ...resolvedScan.body,
        qrContent: decodedQrText,
        data: {
          ...(resolvedScan.body?.data || {}),
          scanImageJob,
          decodedBy: pythonResult.mode || "python",
        },
      });
    } catch (error) {
      await pictureModel.markPictureAsFailed(
        pictureId,
        error.message || "The backend could not decode the uploaded QR image.",
      );

      return createResponse(200, {
        success: false,
        message: "Please scan a valid QR code.",
        data: {
          scanImageJob: {
            pictureId,
            captureSource: storedImage.source,
            imageUrl: storedImage.publicUrl,
            processedImageUrl: processedImageTarget.publicUrl,
            processingStatus: "FAILED",
            processingNote: error.message || "The backend could not decode the uploaded QR image.",
          },
        },
      });
    }
  },

  // Ham nay dung de nhan anh tu camera hoac gallery, luu vao app/QRScan va tra URL cho frontend.
  // Nhan vao: file la anh do multer doc duoc, source cho biet anh den tu camera hay gallery.
  // Tra ve: object response chua metadata cua anh da duoc luu de frontend hien preview hoac tai xuong.
  async preprocessImage(file, source = "camera") {
    if (!file) {
      return createValidationError("Image file is required.");
    }

    if (!String(file.mimetype || "").toLowerCase().startsWith("image/")) {
      return createValidationError("Only image uploads are supported.");
    }

    try {
      const pictureId = createUUID();
      const storedImage = saveScanImage({ file, source });
      const processedImageTarget = buildProcessedImageTarget(pictureId, ".png");

      await pictureModel.createScanPicture({
        pictureId,
        pictureGroup: "QR_SCAN",
        captureSource: storedImage.source,
        originalFileName: storedImage.fileName,
        originalMimeType: file.mimetype,
        originalStoragePath: storedImage.relativeStoragePath,
        originalPublicUrl: storedImage.publicUrl,
        processedFileName: processedImageTarget.fileName,
        processedStoragePath: processedImageTarget.relativeStoragePath,
        processedPublicUrl: processedImageTarget.publicUrl,
        processingStatus: "PENDING",
        processingNote: "Waiting for the Python/OpenCV processing worker.",
      });

      requestQrProcessingCycle();

      return createResponse(200, {
        success: true,
        message: "QR image received successfully. The backend processing worker has been queued.",
        data: {
          pictureId,
          fileName: storedImage.fileName,
          source: storedImage.source,
          imageUrl: storedImage.publicUrl,
          downloadUrl: storedImage.publicUrl,
          originalStoragePath: storedImage.relativeStoragePath,
          processedImageFileName: processedImageTarget.fileName,
          processedImagePath: processedImageTarget.relativeStoragePath,
          processedImageUrl: processedImageTarget.publicUrl,
          processingStatus: "PENDING",
          savedAt: storedImage.savedAt,
        },
      });
    } catch (error) {
      console.error("Service Error (preprocessImage):", error);
      return createResponse(500, {
        success: false,
        message: "Unable to store the image for QR preprocessing.",
      });
    }
  },

  // Ham nay dung de tra ve trang thai xu ly hien tai cua mot anh QR da luu trong bang pictures.
  // Nhan vao: pictureId la ma ban ghi anh can theo doi.
  // Tra ve: metadata processing de frontend poll va hien preview anh da xu ly.
  async getPreprocessedImageStatus(pictureId) {
    const normalizedPictureId = typeof pictureId === "string" ? pictureId.trim() : "";

    if (!normalizedPictureId) {
      return createValidationError("pictureId is required.");
    }

    try {
      const picture = await pictureModel.findById(normalizedPictureId);

      if (!picture) {
        return createResponse(404, {
          success: false,
          message: "The requested scan image could not be found.",
        });
      }

      return createResponse(200, {
        success: true,
        message: "The scan image status was loaded successfully.",
        data: {
          pictureId: picture.picture_id,
          captureSource: picture.capture_source,
          imageUrl: picture.original_public_url,
          processedImageUrl: picture.processed_public_url,
          processingStatus: picture.processing_status,
          processingNote: picture.processing_note,
          createdAt: picture.created_at,
          processedAt: picture.processed_at,
        },
      });
    } catch (error) {
      console.error("Service Error (getPreprocessedImageStatus):", error);
      return createResponse(500, {
        success: false,
        message: "Unable to load the processed scan image status.",
      });
    }
  },
};

module.exports = scanService;
