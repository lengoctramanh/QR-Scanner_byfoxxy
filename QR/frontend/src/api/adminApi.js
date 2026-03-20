import axiosClient from "./axiosClient";

const adminApi = {
  // Ham nay dung de lay danh sach ho so dang ky brand cho admin review.
  // Nhan vao: params la bo loc query tuy chon gui kem request.
  // Tra ve: Promise response tu endpoint /admin/brand-registration-requests.
  getBrandRegistrationRequests: (params = {}) => axiosClient.get("/admin/brand-registration-requests", { params }),

  // Ham nay dung de lay chi tiet mot ho so dang ky brand theo requestId.
  // Nhan vao: requestId la ma request admin muon xem.
  // Tra ve: Promise response tu endpoint detail cua request.
  getBrandRegistrationRequestDetail: (requestId) => axiosClient.get(`/admin/brand-registration-requests/${requestId}`),

  // Ham nay dung de tao tai khoan brand tu request da duoc admin phe duyet.
  // Nhan vao: requestId la ma request va payload co the chua adminNote.
  // Tra ve: Promise response tu endpoint create-account.
  approveBrandRegistrationRequest: (requestId, payload = {}) => axiosClient.post(`/admin/brand-registration-requests/${requestId}/create-account`, payload),

  // Ham nay dung de danh dau request dang ky brand la bi tu choi.
  // Nhan vao: requestId la ma request va payload co the chua adminNote.
  // Tra ve: Promise response tu endpoint reject cua request.
  rejectBrandRegistrationRequest: (requestId, payload = {}) => axiosClient.post(`/admin/brand-registration-requests/${requestId}/reject`, payload),
};

export default adminApi;
