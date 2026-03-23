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

// Ham nay dung de poll trang thai xu ly anh QR ma backend dang chay bang Python/OpenCV.
// Nhan vao: pictureId la ma anh duoc tra ve sau upload thanh cong.
// Tra ve: object success/data/message de trang Home cap nhat preview.
export const fetchScanImageStatus = async (pictureId) => {
  try {
    const response = await scanApi.getPreprocessImageStatus(pictureId);

    return {
      success: response.success !== false,
      data: response.data || null,
      message: response.message || "",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Unable to load the processed scan image status right now.",
    };
  }
};

// Ham nay dung de gui chuoi QR da giai ma len backend va nhan ket qua scan thong nhat.
// Nhan vao: qrContent la noi dung QR va metadata la bo thong tin scan bo sung.
// Tra ve: object success/verdict/code/data hoac message loi cho trang Home xu ly.
export const resolveQrContent = async (qrContent, metadata = {}) => {
  try {
    const response = await scanApi.resolveQrContent({
      qrContent,
      ...metadata,
    });

    return {
      success: response.success !== false,
      verdict: response.verdict || "",
      code: response.code || "",
      message: response.message || "",
      data: response.data || null,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Unable to resolve the scanned QR content right now.",
    };
  }
};

// Ham nay dung de gui anh quet len backend va nhan ket qua resolve QR bang Python/OpenCV.
// Nhan vao: file la anh scan, source la camera/gallery va metadata la thong tin client bo sung.
// Tra ve: object thong nhat gom ket qua scan, qrContent va metadata anh da xu ly.
export const resolveQrFromImage = async (file, source, metadata = {}) => {
  try {
    const payload = new FormData();
    payload.append("image", file);
    payload.append("source", source);

    Object.entries(metadata || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        payload.append(key, value);
      }
    });

    const response = await scanApi.resolveScanImage(payload);

    return {
      success: response.success !== false,
      verdict: response.verdict || "",
      code: response.code || "",
      message: response.message || "",
      data: response.data || null,
      qrContent: response.qrContent || "",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Unable to resolve the uploaded QR image right now.",
    };
  }
};
