import axiosClient from "./axiosClient";

const authApi = {
  register: (data) => axiosClient.post("/auth/register", data),
  login: (data) => axiosClient.post("/auth/login", data),
  forgotPassword: (data) => axiosClient.post("/auth/forgot-password", data),
};

export default authApi;
