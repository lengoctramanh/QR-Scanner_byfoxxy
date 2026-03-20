import axiosClient from "./axiosClient";

const scanApi = {
  // Ham nay dung de gui mot anh quet QR len backend de luu vao kho app/QRScan.
  // Nhan vao: payload la FormData chua file anh va thong tin source.
  // Tra ve: Promise response tu endpoint /scan/preprocess-image.
  preprocessImage: (payload) => axiosClient.post("/scan/preprocess-image", payload),
};

export default scanApi;
