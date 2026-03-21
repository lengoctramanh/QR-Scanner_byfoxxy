import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { uploadScanImage } from "../services/scanService";
import { processQrFromImage } from "../utils/qrScannerUtil";
import "./Home.css";

// Ham nay dung de render trang quet QR theo luong chup anh tu camera hoac chon tu thu vien.
// Nhan vao: khong nhan props, su dung state noi bo va cac ref camera/file.
// Tra ve: giao dien xin quyen camera, chup frame, upload anh va hien preview anh da luu.
export default function Home() {
  const [cameraState, setCameraState] = useState("idle");
  const [feedback, setFeedback] = useState({
    tone: "",
    message: "",
  });

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Ham nay dung de dung stream camera hien tai va xoa lien ket den the video.
  // Nhan vao: khong nhan tham so nao.
  // Tac dong: stop toan bo track camera va dua preview ve trang thai trong.
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Ham nay dung de cap nhat hop thong bao trang thai ngan gon ben duoi khung scan.
  // Nhan vao: tone la kieu hien thi, message la noi dung thong bao can hien.
  // Tac dong: cap nhat state feedback de giao dien render loading, success hoac error.
  const setFeedbackState = (tone, message) => {
    setFeedback({
      tone,
      message,
    });
  };

  // Ham nay dung de kiem tra anh co chua ma QR hop le truoc khi gui len backend hay khong.
  // Nhan vao: file la anh chup tu camera hoac chon tu thu vien.
  // Tra ve: true neu jsQR doc duoc ma QR, false neu khong phat hien duoc.
  const validateQrCandidate = async (file) => {
    try {
      await processQrFromImage(file);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Ham nay dung de gui anh len backend sau khi da xac nhan day la anh QR hop le.
  // Nhan vao: file la anh can upload, source la camera hoac gallery.
  // Tac dong: goi scanService, cap nhat feedback va dung camera sau khi backend luu anh vao QRScan.
  const handleImageUpload = async (file, source) => {
    setCameraState("uploading");
    setFeedbackState("loading", "Processing the QR image...");

    const isValidQr = await validateQrCandidate(file);

    if (!isValidQr) {
      stopCameraStream();
      setCameraState("idle");
      setFeedbackState("error", "Please scan a valid QR code.");
      return;
    }

    const result = await uploadScanImage(file, source);

    stopCameraStream();
    setCameraState("idle");

    if (!result.success) {
      setFeedbackState("error", result.message || "Please scan a valid QR code.");
      return;
    }

    setFeedbackState("success", "QR image captured successfully. The backend stored it for the next processing step.");
  };

  // Ham nay dung de xin quyen camera va hien preview song trong khung scan.
  // Nhan vao: khong nhan tham so nao.
  // Tac dong: goi getUserMedia, mo stream camera va dua cameraState ve ready.
  const startCameraPreview = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setFeedbackState("error", "This browser does not support camera access.");
      return;
    }

    setCameraState("requesting");
    setFeedbackState("loading", "Requesting camera access...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraState("ready");
      setFeedbackState("", "");
    } catch (error) {
      stopCameraStream();
      setCameraState("idle");
      setFeedbackState("error", "Camera access was denied or is unavailable on this device.");
    }
  };

  // Ham nay dung de chup mot frame tu video preview va tao file anh gui len backend.
  // Nhan vao: khong nhan tham so nao.
  // Tac dong: ve frame hien tai len canvas, tao blob JPEG va goi handleImageUpload.
  const captureCurrentFrame = async () => {
    const videoElement = videoRef.current;

    if (!videoElement || !streamRef.current) {
      setFeedbackState("error", "Camera preview is not ready yet.");
      return;
    }

    const canvas = document.createElement("canvas");
    const width = videoElement.videoWidth || 1080;
    const height = videoElement.videoHeight || 1080;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      setFeedbackState("error", "Unable to capture the current camera frame.");
      return;
    }

    context.drawImage(videoElement, 0, 0, width, height);

    try {
      const imageBlob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
              return;
            }

            reject(new Error("Unable to create an image from the camera frame."));
          },
          "image/jpeg",
          0.92,
        );
      });

      const file = new File([imageBlob], `qr-camera-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      await handleImageUpload(file, "camera");
    } catch (error) {
      setFeedbackState("error", error.message || "Unable to capture the camera frame.");
    }
  };

  // Ham nay dung de dieu phoi nut Scan: lan dau mo camera, lan hai chup frame va upload.
  // Nhan vao: khong nhan tham so nao.
  // Tac dong: dua camera qua tung buoc xin quyen, preview va capture.
  const handleScanClick = async () => {
    if (cameraState === "requesting" || cameraState === "uploading") {
      return;
    }

    if (cameraState === "ready") {
      await captureCurrentFrame();
      return;
    }

    await startCameraPreview();
  };

  // Ham nay dung de mo bo chon anh tu thu vien cua thiet bi.
  // Nhan vao: khong nhan tham so nao.
  // Tac dong: kich hoat input file an thong qua ref.
  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  // Ham nay dung de lay anh nguoi dung chon tu thu vien va upload len backend.
  // Nhan vao: event onChange cua input file.
  // Tac dong: lay file dau tien, dua qua flow handleImageUpload va reset input.
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await handleImageUpload(file, "gallery");
    event.target.value = "";
  };

  // Ham nay dung de dong camera thu cong khi nguoi dung muon ve lai trang thai ban dau.
  // Nhan vao: khong nhan tham so nao.
  // Tac dong: dung stream camera va dat thong diep huong dan moi cho nguoi dung.
  const handleCloseCamera = () => {
    stopCameraStream();
    setCameraState("idle");
    setFeedbackState("", "");
  };

  const scanButtonLabel =
    cameraState === "requesting"
      ? "REQUESTING CAMERA..."
      : cameraState === "uploading"
        ? "PROCESSING..."
        : "SCAN";

  return (
    <>
      <h1 className="page-title">SCAN</h1>

      <main className="home-main">
        <div className={`scanner-container ${cameraState === "ready" ? "camera-live" : ""}`}>
          <div className="corner top-left" />
          <div className="corner top-right" />
          <div className="corner bottom-left" />
          <div className="corner bottom-right" />

          {cameraState === "ready" || cameraState === "requesting" ? <video ref={videoRef} className="camera-preview" autoPlay muted playsInline /> : null}
        </div>

        {feedback.message ? (
          <div className={`scan-feedback ${feedback.tone}`}>
            {feedback.tone === "loading" ? <LoaderCircle size={18} className="scan-feedback-spinner" /> : null}
            <span>{feedback.message}</span>
          </div>
        ) : null}

        <div className="actions">
          <button className="scan-btn" type="button" onClick={handleScanClick} disabled={cameraState === "requesting" || cameraState === "uploading"}>
            {scanButtonLabel}
          </button>

          {cameraState === "ready" ? (
            <button className="secondary-action-btn" type="button" onClick={handleCloseCamera}>
              CLOSE CAMERA
            </button>
          ) : null}

          <button className="gallery-box" type="button" onClick={handleGalleryClick} disabled={cameraState === "uploading"}>
            <i className="fa-regular fa-image" />
            <span>Select from Gallery</span>
          </button>

          <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUpload} />
        </div>
      </main>
    </>
  );
}
