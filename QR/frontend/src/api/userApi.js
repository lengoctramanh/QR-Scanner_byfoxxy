import axiosClient from "./axiosClient";

const userApi = {
  // Ham nay dung de nap du lieu dashboard that cho user dang dang nhap.
  // Nhan vao: khong nhan tham so, su dung Bearer token tu axiosClient.
  // Tra ve: Promise response tu endpoint /user/dashboard.
  getDashboard: () => axiosClient.get("/user/dashboard"),

  // Ham nay dung de gui FormData cap nhat profile hien tai cua tai khoan dang dang nhap.
  // Nhan vao: data la FormData chua field text va avatar/logo neu co.
  // Tra ve: Promise response tu endpoint /profile.
  updateProfile: (data) => axiosClient.put("/profile", data),

  // Ham nay dung de gui yeu cau doi mat khau cho tai khoan dang dang nhap.
  // Nhan vao: data la object chua currentPassword, newPassword va confirmPassword.
  // Tra ve: Promise response tu endpoint /change-password.
  changePassword: (data) => axiosClient.post("/change-password", data),

  // Ham nay dung de claim Token(2) cho user dang dang nhap.
  // Nhan vao: data la object chua token raw hoac claim URL.
  // Tra ve: Promise response tu endpoint /user/claim-token.
  claimGuestToken: (data) => axiosClient.post("/user/claim-token", data),

  // Ham nay dung de xoa mem mot dong lich su scan cua user.
  // Nhan vao: userHistoryId la ma item can an khoi dashboard.
  // Tra ve: Promise response tu endpoint /user/history/:userHistoryId.
  deleteScanHistory: (userHistoryId) => axiosClient.delete(`/user/history/${userHistoryId}`),
};

export default userApi;
