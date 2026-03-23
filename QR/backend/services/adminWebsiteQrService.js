const fs = require("fs/promises");
const { v4: createUUID } = require("uuid");

const db = require("../config/database");
const websiteQrModel = require("../models/websiteQrModel");
const { generateUrlQrImage, normalizeWebsiteUrl } = require("../app/urlQrGenerator");

// Ham nay dung de doi ten field tu DB row sang object camelCase de frontend dung truc tiep.
// Nhan vao: row la ban ghi website_qr_configs vua doc tu MySQL.
// Tra ve: object camelCase hoac null neu khong co row.
const mapWebsiteQrRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    configId: row.config_id,
    websiteUrl: row.website_url,
    compactUrl: row.compact_url,
    changeNumber: row.change_number,
    fileName: row.qr_file_name,
    storagePath: row.qr_storage_path,
    qrImageUrl: row.qr_public_url,
    createdByAdminId: row.created_by_admin_id,
    createdAt: row.created_at,
  };
};

// Ham nay dung de nap payload chuan gom cau hinh hien tai va lich su phien ban gan nhat.
// Nhan vao: khong nhan tham so, du lieu duoc doc truc tiep tu model.
// Tra ve: object current/history de controller tra ve cho frontend.
const buildWebsiteQrPayload = async () => {
  const historyRows = await websiteQrModel.listHistory(12);
  const history = historyRows.map(mapWebsiteQrRow);

  return {
    current: history[0] || null,
    history,
  };
};

const adminWebsiteQrService = {
  // Ham nay dung de lay cau hinh website QR hien tai va lich su thay doi cho tab admin.
  // Nhan vao: khong nhan tham so.
  // Tra ve: ket qua nghiep vu chua current config va history.
  async getWebsiteQrConfig() {
    try {
      const data = await buildWebsiteQrPayload();

      return {
        isValid: true,
        httpStatus: 200,
        data,
      };
    } catch (error) {
      console.error("Service Error (getWebsiteQrConfig):", error);
      return {
        isValid: false,
        httpStatus: 500,
        message: "Unable to load the website QR configuration.",
      };
    }
  },

  // Ham nay dung de luu website URL moi, sinh file QR va ghi lich su cap nhat cua admin.
  // Nhan vao: websiteUrl la URL admin nhap va adminAccountId la nguoi thuc hien thao tac.
  // Tra ve: ket qua nghiep vu gom payload moi nhat va thong bao thanh cong/that bai.
  async updateWebsiteQrConfig({ websiteUrl, adminAccountId }) {
    if (!adminAccountId) {
      return {
        isValid: false,
        httpStatus: 401,
        message: "Unauthorized administrator session.",
      };
    }

    let normalizedWebsiteUrl;

    try {
      normalizedWebsiteUrl = normalizeWebsiteUrl(websiteUrl);
    } catch (error) {
      return {
        isValid: false,
        httpStatus: 400,
        message: error.message,
      };
    }

    try {
      const latestConfig = await websiteQrModel.findLatest();

      if (latestConfig && latestConfig.website_url === normalizedWebsiteUrl) {
        return {
          isValid: true,
          httpStatus: 200,
          message: "The website URL is already current, so no new QR version was generated.",
          data: await buildWebsiteQrPayload(),
        };
      }
    } catch (error) {
      console.error("Service Error (updateWebsiteQrConfig precheck):", error);
      return {
        isValid: false,
        httpStatus: 500,
        message: "Unable to validate the current website QR configuration.",
      };
    }

    const connection = await db.getConnection();
    let generatedQrFile = null;

    try {
      await connection.beginTransaction();

      const nextChangeNumber = await websiteQrModel.getNextChangeNumber({
        executor: connection,
      });

      generatedQrFile = await generateUrlQrImage({
        websiteUrl: normalizedWebsiteUrl,
        changeNumber: nextChangeNumber,
      });

      await websiteQrModel.createConfig(
        {
          configId: createUUID(),
          websiteUrl: generatedQrFile.normalizedUrl,
          compactUrl: generatedQrFile.compactUrl,
          changeNumber: nextChangeNumber,
          qrFileName: generatedQrFile.fileName,
          qrStoragePath: generatedQrFile.filePath,
          qrPublicUrl: generatedQrFile.publicUrl,
          createdByAdminId: adminAccountId,
        },
        { executor: connection },
      );

      await connection.commit();

      return {
        isValid: true,
        httpStatus: 200,
        message: "The website QR code was generated and saved successfully.",
        data: await buildWebsiteQrPayload(),
      };
    } catch (error) {
      await connection.rollback();

      if (generatedQrFile?.filePath) {
        await fs.unlink(generatedQrFile.filePath).catch(() => {});
      }

      console.error("Service Error (updateWebsiteQrConfig):", error);
      return {
        isValid: false,
        httpStatus: 500,
        message: "Unable to generate and save the website QR code.",
      };
    } finally {
      connection.release();
    }
  },
};

module.exports = adminWebsiteQrService;
