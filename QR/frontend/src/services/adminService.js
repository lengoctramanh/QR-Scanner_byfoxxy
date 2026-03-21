import adminApi from "../api/adminApi";

// Ham nay dung de dong goi mot ket qua that bai thong nhat cho cac API admin.
// Nhan vao: error la doi tuong loi bat duoc tu axios va fallbackMessage la thong diep mac dinh.
// Tra ve: object success false kem message tien xu ly de hook va page de dung.
const buildAdminErrorResult = (error, fallbackMessage) => ({
  success: false,
  message: error.response?.data?.message || fallbackMessage,
});

// Ham nay dung de lay danh sach ho so dang ky brand tu backend cho dashboard admin.
// Nhan vao: filters la object query tuy chon nhu status.
// Tra ve: object success/data/message de hook admin su dung.
export const fetchBrandRegistrationRequests = async (filters = {}) => {
  try {
    const response = await adminApi.getBrandRegistrationRequests(filters);

    return {
      success: response.success !== false,
      data: Array.isArray(response.data) ? response.data : [],
      message: response.message || "",
    };
  } catch (error) {
    return buildAdminErrorResult(error, "Unable to load the brand registration queue.");
  }
};

// Ham nay dung de lay chi tiet mot ho so dang ky brand theo requestId.
// Nhan vao: requestId la ma request can mo trong modal review.
// Tra ve: object success/data/message de hook admin cap nhat modal.
export const fetchBrandRegistrationRequestDetail = async (requestId) => {
  try {
    const response = await adminApi.getBrandRegistrationRequestDetail(requestId);

    return {
      success: response.success !== false,
      data: response.data || null,
      message: response.message || "",
    };
  } catch (error) {
    return buildAdminErrorResult(error, "Unable to load the selected brand request.");
  }
};

// Ham nay dung de phe duyet mot request dang ky brand va tao tai khoan brand that.
// Nhan vao: requestId la ma request can approve va adminNote la ghi chu tuy chon.
// Tra ve: object success/data/message de hook admin refresh queue va hien banner.
export const approveBrandRegistrationRequest = async (requestId, adminNote = "") => {
  try {
    const response = await adminApi.approveBrandRegistrationRequest(requestId, {
      adminNote,
    });

    return {
      success: response.success !== false,
      data: response.data || null,
      message: response.message || "The brand account was created successfully.",
    };
  } catch (error) {
    return buildAdminErrorResult(error, "Unable to approve the brand registration request.");
  }
};

// Ham nay dung de tu choi mot request dang ky brand tren dashboard admin.
// Nhan vao: requestId la ma request can reject va adminNote la ghi chu tuy chon.
// Tra ve: object success/data/message de hook admin xu ly ket qua.
export const rejectBrandRegistrationRequest = async (requestId, adminNote = "") => {
  try {
    const response = await adminApi.rejectBrandRegistrationRequest(requestId, {
      adminNote,
    });

    return {
      success: response.success !== false,
      data: response.data || null,
      message: response.message || "The brand registration request was rejected.",
    };
  } catch (error) {
    return buildAdminErrorResult(error, "Unable to reject the brand registration request.");
  }
};
