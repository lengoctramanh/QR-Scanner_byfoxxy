import axiosClient from "./axiosClient";

const authApi = {
  // Ham nay dung de gui du lieu dang ky tai khoan len backend.
  // Nhan vao: data la payload dang ky co the la FormData.
  // Tra ve: Promise response tu endpoint /auth/register.
  register: (data) => axiosClient.post("/auth/register", data),

  // Ham nay dung de gui thong tin dang nhap len backend.
  // Nhan vao: data la object chua identifier va password.
  // Tra ve: Promise response tu endpoint /auth/login.
  login: (data) => axiosClient.post("/auth/login", data),

  // Ham nay dung de gui yeu cau lay OTP quen mat khau len backend.
  // Nhan vao: data la object chua email hoac so dien thoai.
  // Tra ve: Promise response tu endpoint /auth/forgot-password.
  forgotPassword: (data) => axiosClient.post("/auth/forgot-password", data),

  // Ham nay dung de lay profile hien tai cua tai khoan dang dang nhap.
  // Nhan vao: khong nhan tham so, token da duoc axiosClient tu dong gan vao header.
  // Tra ve: Promise response tu endpoint /auth/me.
  getMe: () => axiosClient.get("/auth/me"),
};

export default authApi;
