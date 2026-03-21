import axios from "axios";
import { authStorage } from "../utils/authStorage";

const axiosClient = axios.create({
  baseURL: "/api",
});

// Ham nay dung de chuan hoa header truoc khi moi request duoc gui di.
// Nhan vao: config la cau hinh request hien tai cua axios.
// Tra ve: config moi da duoc bo sung Content-Type va Authorization neu da dang nhap.
axiosClient.interceptors.request.use((config) => {
  const nextConfig = { ...config };
  const headers = { ...(nextConfig.headers || {}) };
  const token = authStorage.getToken();

  if (nextConfig.data instanceof FormData) {
    delete headers["Content-Type"];
  } else {
    headers["Content-Type"] = "application/json";
  }

  // Ham nay dung de tu dong gui Bearer token cho cac request can xac thuc.
  // Nhan vao: token da duoc luu trong localStorage sau khi dang nhap thanh cong.
  // Tac dong: bo sung header Authorization de backend requireAuth doc duoc session.
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  nextConfig.headers = headers;
  return nextConfig;
});

// Ham nay dung de cat gon response axios chi lay phan du lieu can dung.
// Nhan vao: response thanh cong hoac doi tuong error tu axios.
// Tra ve: response.data neu thanh cong, hoac nem lai loi neu request that bai.
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error),
);

export default axiosClient;
