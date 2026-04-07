const brandProductService = require("../services/brandProductService");

const brandProductController = {
  // Ham nay dung de tao san pham moi cho brand, sinh QR thong tin/xac thuc va tra asset ve frontend.
  // Nhan vao: req.auth.accountId, req.body va res de gui ket qua.
  // Tac dong: goi service tao product + QR roi tra JSON ket qua.
  async createProductWithQr(req, res) {
    try {
      const result = await brandProductService.createProductWithQr({
        accountId: req.auth?.accountId,
        rawPayload: req.body,
      });

      if (!result.isValid) {
        return res.status(result.httpStatus).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("Controller Error (createProductWithQr):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Ham nay dung de tra danh sach san pham cua brand dang dang nhap.
  // Nhan vao: req.auth.accountId va res de gui JSON.
  // Tac dong: goi service listProducts va tra ket qua ve client.
  async listProducts(req, res) {
    try {
      const result = await brandProductService.listProducts({
        accountId: req.auth?.accountId,
      });

      if (!result.isValid) {
        return res.status(result.httpStatus).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("Controller Error (listBrandProducts):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Ham nay dung de tai file template Excel mau cho brand dang ky batch hang loat.
  // Nhan vao: req, res thong thuong cua Express.
  // Tac dong: goi service tao buffer xlsx va tra ve dang file download.
  async downloadBatchTemplate(req, res) {
    try {
      const result = await brandProductService.downloadBatchTemplate();

      if (!result.isValid) {
        return res.status(result.httpStatus).json({
          success: false,
          message: result.message,
        });
      }

      res.setHeader("Content-Type", result.mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
      return res.status(result.httpStatus).send(result.buffer);
    } catch (error) {
      console.error("Controller Error (downloadBatchTemplate):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Ham nay dung de nhan file Excel batch va tao nhieu product QR set cho brand.
  // Nhan vao: req.auth.accountId, req.file va res de gui ket qua JSON.
  // Tac dong: goi service uploadProductBatchFile va tra thong tin tong hop ve frontend.
  async uploadProductBatchFile(req, res) {
    try {
      const result = await brandProductService.uploadProductBatchFile({
        accountId: req.auth?.accountId,
        file: req.file,
      });

      if (!result.isValid) {
        return res.status(result.httpStatus).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("Controller Error (uploadProductBatchFile):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Ham nay dung de dong goi batch asset thanh file ZIP de xuat cho xuong in.
  // Nhan vao: req.auth.accountId, req.params.batchId va res de tra file.
  // Tac dong: goi service exportBatchZip va stream file zip xuong client.
  async exportBatchZip(req, res) {
    try {
      const result = await brandProductService.exportBatchZip({
        accountId: req.auth?.accountId,
        batchId: req.params?.batchId,
      });

      if (!result.isValid) {
        return res.status(result.httpStatus).json({
          success: false,
          message: result.message,
        });
      }

      res.setHeader("Content-Type", result.mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
      return res.status(result.httpStatus).send(result.buffer);
    } catch (error) {
      console.error("Controller Error (exportBatchZip):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },
};

module.exports = brandProductController;
