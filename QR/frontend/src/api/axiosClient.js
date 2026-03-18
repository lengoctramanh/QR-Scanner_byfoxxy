import axios from "axios";

const axiosClient = axios.create({
  baseURL: "/api",
});

axiosClient.interceptors.request.use((config) => {
  const nextConfig = { ...config };
  const headers = { ...(nextConfig.headers || {}) };

  if (nextConfig.data instanceof FormData) {
    delete headers["Content-Type"];
  } else {
    headers["Content-Type"] = "application/json";
  }

  nextConfig.headers = headers;
  return nextConfig;
});

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

export default axiosClient;
