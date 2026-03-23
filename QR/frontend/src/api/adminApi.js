import axiosClient from "./axiosClient";

const adminApi = {
  // Ham nay dung de lay cau hinh website QR hien tai va lich su cap nhat cua admin.
  // Nhan vao: khong nhan tham so.
  // Tra ve: Promise response tu endpoint /admin/website-qr.
  getWebsiteQrConfig: () => axiosClient.get("/admin/website-qr"),

  // Ham nay dung de luu URL website moi va yeu cau backend sinh QR cho URL do.
  // Nhan vao: payload chua websiteUrl ma admin vua nhap.
  // Tra ve: Promise response tu endpoint PUT /admin/website-qr.
  updateWebsiteQrConfig: (payload = {}) => axiosClient.put("/admin/website-qr", payload),

  // Ham nay dung de lay snapshot he thong that tu DB cho dashboard admin.
  // Nhan vao: khong nhan tham so.
  // Tra ve: Promise response tu endpoint /admin/system-summary.
  getSystemSummary: () => axiosClient.get("/admin/system-summary"),

  // Ham nay dung de revoke mot session dang song trong he thong.
  // Nhan vao: sessionId la ma session can thu hoi.
  // Tra ve: Promise response tu endpoint /admin/sessions/:sessionId/revoke.
  revokeSession: (sessionId) => axiosClient.post(`/admin/sessions/${sessionId}/revoke`),

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
