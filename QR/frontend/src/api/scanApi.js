import axiosClient from "./axiosClient";

const scanApi = {
  // Ham nay dung de gui noi dung QR da giai ma len backend de tu dong nhan dien va xu ly.
  // Nhan vao: payload la object chua qrContent va metadata scan tuy chon.
  // Tra ve: Promise response tu endpoint /scan/resolve.
  resolveQrContent: (payload) => axiosClient.post("/scan/resolve", payload),

  // Ham nay dung de gui mot anh quet QR len backend de luu vao kho app/QRScan.
  // Nhan vao: payload la FormData chua file anh va thong tin source.
  // Tra ve: Promise response tu endpoint /scan/preprocess-image.
  preprocessImage: (payload) => axiosClient.post("/scan/preprocess-image", payload),

  // Ham nay dung de gui anh len backend va cho backend tu giai ma + resolve QR trong mot request.
  // Nhan vao: payload la FormData chua file anh, source va metadata scan.
  // Tra ve: Promise response tu endpoint /scan/resolve-image.
  resolveScanImage: (payload) => axiosClient.post("/scan/resolve-image", payload),

  // Ham nay dung de lay trang thai xu ly cua mot anh scan da upload len backend.
  // Nhan vao: pictureId la ma record anh can poll.
  // Tra ve: Promise response tu endpoint /scan/preprocess-image/:pictureId.
  getPreprocessImageStatus: (pictureId) => axiosClient.get(`/scan/preprocess-image/${pictureId}`),
};

export default scanApi;
