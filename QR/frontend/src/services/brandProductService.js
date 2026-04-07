import brandProductApi from "../api/brandProductApi";

// Ham nay dung de lay danh sach san pham cua brand va dong goi ket qua cho hook dashboard.
// Nhan vao: khong nhan tham so.
// Tra ve: object success/data/message de giao dien render manage products.
export const fetchBrandProducts = async () => {
  try {
    const response = await brandProductApi.getBrandProducts();

    return {
      success: response.success !== false,
      data: Array.isArray(response.data) ? response.data : [],
      message: response.message || "",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Unable to load the brand products right now.",
    };
  }
};

// Ham nay dung de tao san pham moi va nhan bo QR asset de test/xuat an.
// Nhan vao: payload la object metadata san pham frontend gui len backend.
// Tra ve: object success/data/message cho hook cap nhat giao dien sau submit.
export const createBrandProduct = async (payload) => {
  try {
    const response = await brandProductApi.createBrandProduct(payload);

    return {
      success: response.success !== false,
      data: response.data || null,
      message: response.message || "Product metadata and authentication QR assets were created successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Unable to create the product and authentication QR assets right now.",
    };
  }
};

// Ham nay dung de tai template batch Excel va tra ve blob cho hook tao file download.
// Nhan vao: khong nhan tham so.
// Tra ve: object success va blob cua file template.
export const downloadBrandBatchTemplate = async () => {
  try {
    const response = await brandProductApi.downloadBatchTemplate();

    return {
      success: true,
      data: response,
      fileName: "brand-batch-template.xlsx",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Unable to download the Excel template right now.",
    };
  }
};

// Ham nay dung de upload file batch va nhan danh sach san pham moi nhat sau khi xu ly.
// Nhan vao: file spreadsheet da duoc nguoi dung chon.
// Tra ve: object success/data/message cho hook cap nhat dashboard.
export const uploadBrandBatchFile = async (file) => {
  try {
    const payload = new FormData();
    payload.append("batchFile", file);

    const response = await brandProductApi.uploadBrandBatchFile(payload);

    return {
      success: response.success !== false,
      data: Array.isArray(response.data) ? response.data : [],
      message: response.message || "The batch spreadsheet was processed successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Unable to process the uploaded batch file right now.",
    };
  }
};

// Ham nay dung de tai file ZIP export cua batch ma brand chon trong catalog.
// Nhan vao: batchId la ma batch can export.
// Tra ve: object success/data/fileName de hook tao thao tac tai xuong.
export const exportBrandBatchZip = async (batchId) => {
  try {
    const response = await brandProductApi.exportBrandBatchZip(batchId);

    return {
      success: true,
      data: response,
      fileName: `${batchId || "brand-batch"}.zip`,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Unable to export the selected batch right now.",
    };
  }
};
