const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { v4: createUUID } = require("uuid");

const db = require("../config/database");
const qrEngine = require("../app/qrEngine");
const { buildProcessedImageTarget, saveScanImage } = require("../app/qrScanStorage");
const { requestQrProcessingCycle } = require("../app/qrProcessingWorker");
const pictureModel = require("../models/pictureModel");
const qrCodeModel = require("../models/qrCodeModel");
const scanLogModel = require("../models/scanLogModel");
const qrActivationModel = require("../models/qrActivationModel");

// Ham nay dung de bam gia tri secret nhap vao truoc khi luu log scan.
// Nhan vao: secretValue la phan bi mat cua secret token.
// Tra ve: chuoi hash SHA-256 dang hex.
const hashHiddenPinInput = (secretValue) =>
  crypto.createHash("sha256").update(secretValue).digest("hex");

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
  scanType,
  scanResult,
  scanContext,
}) => ({
  logId: createUUID(),
  qrPublicTokenInput,
  hiddenPinInputHash,
  qrId,
  accountId: scanContext.accountId,
  fingerprintId: scanContext.fingerprintId,
  scanType,
  scanResult,
  ipAddress: scanContext.ipAddress,
  location: scanContext.location,
  deviceInfo: scanContext.deviceInfo,
});

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
const createBusinessBody = ({ verdict, code, message, qrCode, extraData = {} }) => ({
  success: true,
  verdict,
  code,
  message,
  data: {
    ...buildBasePayload(qrCode),
    ...extraData,
  },
});

// Ham nay dung de tao response loi validate dau vao.
// Nhan vao: message la noi dung loi can tra ve.
// Tra ve: object response gom ma 400 va payload loi.
const createValidationError = (message) =>
  createResponse(400, {
    success: false,
    message,
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
        await scanLogModel.create(
          buildScanLogPayload({
            qrPublicTokenInput: normalizedToken,
            scanType: "PUBLIC_SCAN",
            scanResult: "FAKE",
            scanContext,
          })
        );

        return createResponse(
          200,
          createBusinessBody({
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
          })
        );
      }

      const scanResult = resolvePublicScanResult(qrCode.status);

      await scanLogModel.create(
        buildScanLogPayload({
          qrPublicTokenInput: normalizedToken,
          qrId: qrCode.qr_id,
          scanType: "PUBLIC_SCAN",
          scanResult,
          scanContext,
        })
      );

      switch (qrCode.status) {
        case "NEW":
          return createResponse(
            200,
            createBusinessBody({
              verdict: "INTACT",
              code: "PRODUCT_INTACT",
              message:
                "San pham con nguyen ven. Hay boc tem QR secret de xac thuc hang chinh hang.",
              qrCode,
            })
          );

        case "ACTIVATED":
          return createResponse(
            200,
            createBusinessBody({
              verdict: "SUSPICIOUS",
              code: "PUBLIC_CODE_ALREADY_ACTIVATED",
              message:
                "CANH BAO HANG GIA! Ma public nay da bi boc va kich hoat truoc do.",
              qrCode,
            })
          );

        case "SUSPICIOUS":
          return createResponse(
            200,
            createBusinessBody({
              verdict: "SUSPICIOUS",
              code: "PUBLIC_CODE_SUSPICIOUS",
              message:
                "Ma QR nay dang bi danh dau bat thuong. Khong nen tiep tuc giao dich truoc khi duoc kiem tra them.",
              qrCode,
            })
          );

        case "BLOCKED":
          return createResponse(
            200,
            createBusinessBody({
              verdict: "BLOCKED",
              code: "PUBLIC_CODE_BLOCKED",
              message: "Ma QR nay da bi khoa boi he thong hoac quan tri vien.",
              qrCode,
            })
          );

        case "EXPIRED":
          return createResponse(
            200,
            createBusinessBody({
              verdict: "EXPIRED",
              code: "PUBLIC_CODE_EXPIRED",
              message: "Ma QR nay da het han xac thuc hoac bao hanh.",
              qrCode,
            })
          );

        default:
          return createResponse(
            200,
            createBusinessBody({
              verdict: "SUSPICIOUS",
              code: "PUBLIC_CODE_UNKNOWN_STATE",
              message:
                "Ma QR dang o trang thai khong xac dinh. Can chuyen cho bo phan van hanh kiem tra.",
              qrCode,
            })
          );
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
        await scanLogModel.create(
          buildScanLogPayload({
            qrPublicTokenInput: parsedSecretToken.publicToken,
            hiddenPinInputHash,
            scanType: "PIN_VERIFICATION",
            scanResult: "FAKE",
            scanContext,
          }),
          { executor: connection }
        );

        await connection.commit();

        return createResponse(
          200,
          createBusinessBody({
            verdict: "FAKE",
            code: "SECRET_TOKEN_NOT_FOUND",
            message:
              "Secret token khong khop voi bat ky ma QR nao trong he thong. Day la dau hieu hang gia.",
            qrCode: null,
            extraData: {
              qr: {
                qrId: null,
                publicToken: parsedSecretToken.publicToken,
                status: null,
              },
            },
          })
        );
      }

      if (qrCode.status === "BLOCKED") {
        await scanLogModel.create(
          buildScanLogPayload({
            qrPublicTokenInput: parsedSecretToken.publicToken,
            hiddenPinInputHash,
            qrId: qrCode.qr_id,
            scanType: "PIN_VERIFICATION",
            scanResult: "BLOCKED",
            scanContext,
          }),
          { executor: connection }
        );

        await connection.commit();

        return createResponse(
          200,
          createBusinessBody({
            verdict: "BLOCKED",
            code: "SECRET_CODE_BLOCKED",
            message: "Ma secret nay da bi khoa, khong the tiep tuc xac thuc.",
            qrCode,
          })
        );
      }

      if (qrCode.status === "EXPIRED") {
        await scanLogModel.create(
          buildScanLogPayload({
            qrPublicTokenInput: parsedSecretToken.publicToken,
            hiddenPinInputHash,
            qrId: qrCode.qr_id,
            scanType: "PIN_VERIFICATION",
            scanResult: "EXPIRED",
            scanContext,
          }),
          { executor: connection }
        );

        await connection.commit();

        return createResponse(
          200,
          createBusinessBody({
            verdict: "EXPIRED",
            code: "SECRET_CODE_EXPIRED",
            message: "Ma secret nay da het han xac thuc hoac bao hanh.",
            qrCode,
          })
        );
      }

      const isSecretMatched = await bcrypt.compare(
        parsedSecretToken.secretValue,
        qrCode.hidden_pin_hash
      );

      if (!isSecretMatched) {
        await scanLogModel.create(
          buildScanLogPayload({
            qrPublicTokenInput: parsedSecretToken.publicToken,
            hiddenPinInputHash,
            qrId: qrCode.qr_id,
            scanType: "PIN_VERIFICATION",
            scanResult: "FAKE",
            scanContext,
          }),
          { executor: connection }
        );

        await connection.commit();

        return createResponse(
          200,
          createBusinessBody({
            verdict: "FAKE",
            code: "SECRET_CODE_INVALID",
            message:
              "Secret token khong hop le. San pham co dau hieu bi gia mao hoac bi can thiep.",
            qrCode,
          })
        );
      }

      if (qrCode.status === "NEW") {
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

        await scanLogModel.create(
          buildScanLogPayload({
            qrPublicTokenInput: parsedSecretToken.publicToken,
            hiddenPinInputHash,
            qrId: qrCode.qr_id,
            scanType: "PIN_VERIFICATION",
            scanResult: "VALID",
            scanContext,
          }),
          { executor: connection }
        );

        const activatedQrCode = await qrCodeModel.findOverviewByPublicToken(
          parsedSecretToken.publicToken,
          {
            executor: connection,
          }
        );

        await connection.commit();

        return createResponse(
          200,
          createBusinessBody({
            verdict: "GENUINE",
            code: "SECRET_CODE_ACTIVATED",
            message:
              "Hang chinh hang. Secret token hop le va ma public da duoc khoa cheo thanh cong.",
            qrCode: activatedQrCode || qrCode,
          })
        );
      }

      const activationRecord = await qrActivationModel.findByQrId(qrCode.qr_id, {
        executor: connection,
      });

      if (qrCode.status === "ACTIVATED") {
        const trustedRescan = isSameActivationActor(activationRecord, scanContext);
        const scanResult = trustedRescan ? "VALID" : "SUSPICIOUS";

        await scanLogModel.create(
          buildScanLogPayload({
            qrPublicTokenInput: parsedSecretToken.publicToken,
            hiddenPinInputHash,
            qrId: qrCode.qr_id,
            scanType: "PIN_VERIFICATION",
            scanResult,
            scanContext,
          }),
          { executor: connection }
        );

        await connection.commit();

        if (trustedRescan) {
          return createResponse(
            200,
            createBusinessBody({
              verdict: "GENUINE",
              code: "SECRET_CODE_ALREADY_VERIFIED",
              message:
                "Hang chinh hang. Ma secret nay da duoc xac thuc truoc do boi cung thiet bi hoac tai khoan.",
              qrCode,
              extraData: {
                activation: {
                  activatedAt: activationRecord ? activationRecord.activated_at : qrCode.activated_at,
                },
              },
            })
          );
        }

        return createResponse(
          200,
          createBusinessBody({
            verdict: "SUSPICIOUS",
            code: "SECRET_CODE_REUSED_ON_OTHER_ACTOR",
            message:
              "Secret token dung nhung ma nay da duoc kich hoat truoc do o mot thiet bi hoac tai khoan khac. Can dieu tra kha nang hang gia.",
            qrCode,
            extraData: {
              activation: {
                activatedAt: activationRecord ? activationRecord.activated_at : qrCode.activated_at,
              },
            },
          })
        );
      }

      await scanLogModel.create(
        buildScanLogPayload({
          qrPublicTokenInput: parsedSecretToken.publicToken,
          hiddenPinInputHash,
          qrId: qrCode.qr_id,
          scanType: "PIN_VERIFICATION",
          scanResult: "SUSPICIOUS",
          scanContext,
        }),
        { executor: connection }
      );

      await connection.commit();

      return createResponse(
        200,
        createBusinessBody({
          verdict: "SUSPICIOUS",
          code: "SECRET_CODE_SUSPICIOUS",
          message:
            "Ma secret hop le nhung QR nay dang bi danh dau bat thuong. Can chuyen sang xu ly thu cong.",
          qrCode,
        })
      );
    } catch (error) {
      await connection.rollback();
      console.error("Service Error (handleSecretScan):", error);
      throw error;
    } finally {
      connection.release();
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
};

module.exports = scanService;
