import axiosClient from "./axiosClient";

const brandProductApi = {
  // Ham nay dung de lay danh sach san pham cua brand dang dang nhap.
  // Nhan vao: khong nhan tham so.
  // Tra ve: Promise response tu endpoint /brand/products.
  getBrandProducts: () => axiosClient.get("/brand/products"),

  // Ham nay dung de tai file Excel template mau cho brand dang ky batch hang loat.
  // Nhan vao: khong nhan tham so.
  // Tra ve: Promise blob tu endpoint /brand/products/template.
  downloadBatchTemplate: () =>
    axiosClient.get("/brand/products/template", {
      responseType: "blob",
    }),

  // Ham nay dung de tao san pham moi cung bo QR thong tin va QR xac thuc.
  // Nhan vao: data la object chua metadata san pham va scanLimit.
  // Tra ve: Promise response tu endpoint POST /brand/products.
  createBrandProduct: (data) => axiosClient.post("/brand/products", data),

  // Ham nay dung de upload file spreadsheet de tao nhieu lo QR cung luc.
  // Nhan vao: payload la FormData chua tep batchFile.
  // Tra ve: Promise response tu endpoint /brand/products/batch-upload.
  uploadBrandBatchFile: (payload) => axiosClient.post("/brand/products/batch-upload", payload),

  // Ham nay dung de tai goi ZIP label frame cua mot batch cu the.
  // Nhan vao: batchId la ma batch can export.
  // Tra ve: Promise blob tu endpoint /brand/batches/:batchId/export.
  exportBrandBatchZip: (batchId) =>
    axiosClient.get(`/brand/batches/${batchId}/export`, {
      responseType: "blob",
    }),
};

export default brandProductApi;
