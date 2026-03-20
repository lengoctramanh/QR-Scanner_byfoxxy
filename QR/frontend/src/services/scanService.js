import scanApi from "../api/scanApi";

// Ham nay dung de dong goi file anh tu camera hoac gallery va gui len backend.
// Nhan vao: file la anh can upload, source cho biet anh den tu camera hay gallery.
// Tra ve: object success/data hoac message loi de trang Home xu ly.
export const uploadScanImage = async (file, source) => {
  try {
    const payload = new FormData();
    payload.append("image", file);
    payload.append("source", source);

    const response = await scanApi.preprocessImage(payload);

    return {
      success: response.success !== false,
      data: response.data || null,
      message: response.message || "Image uploaded successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Unable to upload the image for QR preprocessing.",
    };
  }
};
