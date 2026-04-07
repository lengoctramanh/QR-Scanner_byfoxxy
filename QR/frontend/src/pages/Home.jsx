import { useEffect, useRef, useState } from "react";
import { CircleHelp, ExternalLink, Link2, LoaderCircle, PackageSearch, ShieldAlert, ShieldCheck } from "lucide-react";
import { fetchScanImageStatus, resolveQrContent, resolveQrFromImage } from "../services/scanService";
import "./Home.css";

// Ham nay dung de format ngay scan/product sang dinh dang de doc tren giao dien.
// Nhan vao: value la gia tri ngay hoac thoi gian.
// Tra ve: chuoi da format hoac "Pending update" neu khong hop le.
const formatDateLabel = (value) => {
  if (!value) {
    return "Pending update";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Pending update";
  }

  return parsedDate.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// Ham nay dung de format moc thoi gian day du hon cho thong tin session/viewer.
// Nhan vao: value la date/time can hien thi.
// Tra ve: chuoi ngay gio da format hoac "Pending update".
const formatDateTimeLabel = (value) => {
  if (!value) {
    return "Pending update";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Pending update";
  }

  return parsedDate.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Ham nay dung de quy doi verdict backend thanh title, icon va tone UI.
// Nhan vao: verdict la ket qua scan do backend tra ve.
// Tra ve: object style de card ket qua render dong bo.
const getVerdictPresentation = (verdict) => {
  switch (verdict) {
    case "GENUINE":
      return {
        tone: "success",
        title: "Authenticity verified",
        Icon: ShieldCheck,
      };
    case "INTACT":
      return {
        tone: "success",
        title: "Seal still intact",
        Icon: ShieldCheck,
      };
    case "INFO":
      return {
        tone: "info",
        title: "Stored QR matched",
        Icon: PackageSearch,
      };
    case "SUSPICIOUS":
      return {
        tone: "warning",
        title: "Suspicious scan detected",
        Icon: ShieldAlert,
      };
    case "BLOCKED":
      return {
        tone: "error",
        title: "This QR code is blocked",
        Icon: ShieldAlert,
      };
    case "EXPIRED":
      return {
        tone: "warning",
        title: "This QR code is expired",
        Icon: ShieldAlert,
      };
    case "FAKE":
      return {
        tone: "error",
        title: "QR not recognized",
        Icon: ShieldAlert,
      };
    case "OWNED":
      return {
        tone: "warning",
        title: "QR already owned",
        Icon: ShieldAlert,
      };
    default:
      return {
        tone: "info",
        title: "Scan completed",
        Icon: CircleHelp,
      };
  }
};

// Ham nay dung de quy doi scanLayer backend tra ve thanh nhan hien thi de de phan biet QR 1 va cac luong phu.
// Nhan vao: scanLayer la loai lop QR ma backend da nhan dien.
// Tra ve: nhan chuoi ngan gon dung cho badge tren giao dien.
const getScanLayerLabel = (scanLayer, qr) => {
  switch (scanLayer) {
    case "QR_1":
      return "QR 1";
    case "QR_PUBLIC":
      return "Public QR";
    default:
      return qr ? "Authentication QR" : "Tracked QR";
  }
};

// Ham nay dung de render card thong tin scan tu backend cho ca QR xac thuc va QR thong tin.
// Nhan vao: scanResult la object da hop nhat tu service scan frontend.
// Tra ve: JSX thong tin san pham, batch va thong ke scan.
function ScanResultCard({ scanResult }) {
  if (!scanResult?.data) {
    return null;
  }

  const verdictPresentation = getVerdictPresentation(scanResult.verdict);
  const { Icon } = verdictPresentation;
  const { qr, product, brand, batch, viewer } = scanResult.data;
  const qrTypeLabel = getScanLayerLabel(scanResult.data.scanLayer, qr);
  const guestToken = scanResult.data.guestToken;

  return (
    <section className={`scan-result-card ${verdictPresentation.tone}`}>
      <div className="scan-result-header">
        <div className="scan-result-heading">
          <div className={`scan-result-icon ${verdictPresentation.tone}`}>
            <Icon size={18} />
          </div>
          <div>
            <h3>{verdictPresentation.title}</h3>
            <p>{scanResult.message || "The system has processed the scanned QR content."}</p>
          </div>
        </div>

        <div className="scan-result-badges">
          <span className={`scan-result-badge ${verdictPresentation.tone}`}>{scanResult.verdict || "UNKNOWN"}</span>
          <span className="scan-result-badge neutral">{qrTypeLabel}</span>
        </div>
      </div>

      <div className={`scan-viewer-banner ${viewer?.mode || "guest"}`}>
        <strong>{viewer?.mode === "authenticated" ? `Signed in as ${viewer?.role || "account"}` : viewer?.mode === "expired_session" ? "Session expired" : "Guest scan"}</strong>
        <span>{viewer?.note || "You are currently scanning without an authenticated session."}</span>
        {viewer?.mode === "authenticated" ? <small>Session expires at: {formatDateTimeLabel(viewer?.sessionExpiresAt)}</small> : null}
      </div>

      <div className="scan-result-grid">
        <div className="scan-result-item">
          <span className="scan-result-label">Product Name</span>
          <strong>{product?.productName || "Not available"}</strong>
        </div>
        <div className="scan-result-item">
          <span className="scan-result-label">Brand</span>
          <strong>{brand?.brandName || "Not available"}</strong>
        </div>
        <div className="scan-result-item">
          <span className="scan-result-label">Manufacturer</span>
          <strong>{product?.manufacturerName || "Not available"}</strong>
        </div>
        <div className="scan-result-item">
          <span className="scan-result-label">Country of Origin</span>
          <strong>{product?.originCountry || "Not available"}</strong>
        </div>
        <div className="scan-result-item">
          <span className="scan-result-label">Manufacture Date</span>
          <strong>{formatDateLabel(batch?.manufactureDate)}</strong>
        </div>
        <div className="scan-result-item">
          <span className="scan-result-label">Expiry Date</span>
          <strong>{formatDateLabel(batch?.expiryDate)}</strong>
        </div>
        <div className="scan-result-item">
          <span className="scan-result-label">Batch Code</span>
          <strong>{batch?.batchCode || "Not available"}</strong>
        </div>
        {qr ? (
          <>
            <div className="scan-result-item">
              <span className="scan-result-label">Authentication Status</span>
              <strong>{qr.status || "Not available"}</strong>
            </div>
            <div className="scan-result-item">
              <span className="scan-result-label">Public Scan Count</span>
              <strong>{qr.totalPublicScans ?? 0}</strong>
            </div>
            <div className="scan-result-item">
              <span className="scan-result-label">Secret Verification Attempts</span>
              <strong>{qr.totalPinAttempts ?? 0}</strong>
            </div>
            <div className="scan-result-item">
              <span className="scan-result-label">Suspicious Scan Limit</span>
              <strong>{qr.scanLimit ?? "Not available"}</strong>
            </div>
          </>
        ) : null}
      </div>

      <div className="scan-result-description">
        <span className="scan-result-label">Quality Certifications</span>
        <p>{product?.qualityCertifications || "Not available"}</p>
      </div>

      <div className="scan-result-description">
        <span className="scan-result-label">Description</span>
        <p>{product?.description || "No product description has been provided yet."}</p>
      </div>

      {guestToken ? (
        <div className="scan-result-description">
          <span className="scan-result-label">Guest Recovery QR</span>
          <p>{guestToken.message || "Save this QR to reopen the same result later or claim it after signing in."}</p>
          <div className="scan-result-guest-token">
            {guestToken.qrImageUrl ? <img src={guestToken.qrImageUrl} alt="Guest recovery QR" className="scan-result-guest-token-image" /> : null}
            {guestToken.claimUrl ? (
              <a href={guestToken.claimUrl} target="_blank" rel="noreferrer" className="scan-result-link">
                Open the saved guest flow
                <Link2 size={16} />
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {scanResult.qrContent ? (
        <div className="scan-result-description">
          <span className="scan-result-label">Raw Scanned Value</span>
          <code className="scan-result-token">{scanResult.qrContent}</code>
        </div>
      ) : null}

      <div className="scan-result-meta-bar">
        <span>Activation time: {formatDateTimeLabel(qr?.activatedAt)}</span>
        {scanResult.code ? <span>Response code: {scanResult.code}</span> : null}
      </div>

      {product?.generalInfoUrl ? (
        <a href={product.generalInfoUrl} target="_blank" rel="noreferrer" className="scan-result-link">
          Open product details page
          <ExternalLink size={16} />
        </a>
      ) : null}
    </section>
  );
}

// Ham nay dung de render ket qua luu anh goc va anh da xu ly boi worker Python/OpenCV.
// Nhan vao: scanImageJob la metadata picture hien tai.
// Tra ve: JSX card hien status, note va 2 preview image neu co.
function ScanImageProcessingCard({ scanImageJob }) {
  if (!scanImageJob?.pictureId) {
    return null;
  }

  return (
    <section className="scan-image-card">
      <div className="scan-image-card-header">
        <div>
          <h3>Stored Scan Images</h3>
          <p>The original image is saved in QRScan, and the processed output is generated in ProcessedQRScan.</p>
        </div>
        <span className={`scan-image-status-badge ${String(scanImageJob.processingStatus || "").toLowerCase()}`}>
          {scanImageJob.processingStatus || "PENDING"}
        </span>
      </div>

      <p className="scan-image-note">{scanImageJob.processingNote || "The Python worker is preparing the processed image."}</p>

      <div className="scan-image-grid">
        <article className="scan-image-panel">
          <h4>Original Scan</h4>
          {scanImageJob.imageUrl ? <img src={scanImageJob.imageUrl} alt="Original scan" className="scan-image-preview" /> : null}
        </article>

        <article className="scan-image-panel">
          <h4>Processed Scan</h4>
          {scanImageJob.processingStatus === "PROCESSED" && scanImageJob.processedImageUrl ? (
            <img src={scanImageJob.processedImageUrl} alt="Processed scan" className="scan-image-preview" />
          ) : (
            <div className="scan-image-placeholder">
              <LoaderCircle size={18} className="spin" />
              <span>{scanImageJob.processingStatus === "FAILED" ? "Processing failed" : "Waiting for processed image..."}</span>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

// Ham nay dung de render trang quet QR theo luong chup anh tu camera hoac chon tu thu vien.
// Nhan vao: khong nhan props, su dung state noi bo va cac ref camera/file.
// Tra ve: giao dien xin quyen camera, chup frame, upload anh va hien ket qua xu ly QR.
export default function Home() {
  const [cameraState, setCameraState] = useState("idle");
  const [feedback, setFeedback] = useState({
    tone: "",
    message: "",
  });
  const [scanResult, setScanResult] = useState(null);
  const [scanImageJob, setScanImageJob] = useState(null);

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

  // Ham nay dung de tu dong resolve QR link khi trang web duoc mo bang scanTarget/guestToken query.
  // Nhan vao: khong nhan tham so, doc query hien tai tu URL trinh duyet.
  // Tac dong: goi backend resolve ngay tren trang Home ma khong can upload anh.
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);

    if (!query.get("scanTarget") && !query.get("guestToken")) {
      return;
    }

    const restoreScanFromWebsiteLink = async () => {
      setCameraState("uploading");
      setFeedback({
        tone: "loading",
        message: "Restoring the QR flow from the website link...",
      });
      setScanResult(null);

      const resolvedResult = await resolveQrContent(window.location.href, {
        deviceInfo: navigator.userAgent || "Browser scanner",
      });

      setCameraState("idle");

      if (!resolvedResult.success) {
        setFeedback({
          tone: "error",
          message: resolvedResult.message || "Unable to restore the QR result from this link.",
        });
        return;
      }

      const verdictPresentation = getVerdictPresentation(resolvedResult.verdict);
      setScanResult({
        ...resolvedResult,
        qrContent: window.location.href,
      });
      setFeedback({
        tone: verdictPresentation.tone,
        message: resolvedResult.message || "Scan completed.",
      });
      setScanImageJob(null);
    };

    restoreScanFromWebsiteLink();
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

  // Ham nay dung de lay metadata client toi thieu de backend luu vao scan log.
  // Nhan vao: khong nhan tham so nao.
  // Tra ve: object metadata chua thong tin thiet bi co ban.
  const buildScanMetadata = () => ({
    deviceInfo: navigator.userAgent || "Browser scanner",
  });

  // Ham nay dung de gui anh len backend, luu file quet va dong thoi resolve noi dung QR da doc duoc.
  // Nhan vao: file la anh can upload, source la camera hoac gallery.
  // Tac dong: doc QR tu anh, goi backend resolve, cap nhat feedback va hien ket qua thong tin san pham.
  const handleImageUpload = async (file, source) => {
    setCameraState("uploading");
    setFeedbackState("loading", "Processing the QR image...");
    setScanResult(null);
    setScanImageJob(null);

    const resolvedResult = await resolveQrFromImage(file, source, buildScanMetadata());

    stopCameraStream();
    setCameraState("idle");

    if (resolvedResult.data?.scanImageJob) {
      setScanImageJob(resolvedResult.data.scanImageJob);
    }

    if (!resolvedResult.success) {
      setFeedbackState("error", resolvedResult.message || "Unable to process the scanned QR code.");
      return;
    }

    const verdictPresentation = getVerdictPresentation(resolvedResult.verdict);

    setScanResult({
      ...resolvedResult,
      qrContent: resolvedResult.qrContent || "",
    });
    setFeedbackState(verdictPresentation.tone, resolvedResult.message || "Scan completed.");
  };

  // Ham nay dung de poll trang thai anh da xu ly sau khi backend nhan xong anh goc.
  // Nhan vao: scanImageJob.pictureId tu response upload.
  // Tac dong: cap nhat processedImageUrl va processingStatus den khi xong hoac that bai.
  useEffect(() => {
    if (!scanImageJob?.pictureId) {
      return undefined;
    }

    if (!["PENDING", "PROCESSING"].includes(scanImageJob.processingStatus)) {
      return undefined;
    }

    const pollingTimer = window.setInterval(async () => {
      const result = await fetchScanImageStatus(scanImageJob.pictureId);

      if (!result.success || !result.data) {
        return;
      }

      setScanImageJob(result.data);

      if (!["PENDING", "PROCESSING"].includes(result.data.processingStatus)) {
        window.clearInterval(pollingTimer);
      }
    }, 2500);

    return () => {
      window.clearInterval(pollingTimer);
    };
  }, [scanImageJob?.pictureId, scanImageJob?.processingStatus]);

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
    } catch {
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

        <ScanResultCard scanResult={scanResult} />
        <ScanImageProcessingCard scanImageJob={scanImageJob} />
      </main>
    </>
  );
}
