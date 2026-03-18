import { useRef, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Link as LinkIcon, XCircle } from "lucide-react";
import { processQrFromImage } from "../utils/qrScannerUtil";
import "./Home.css";

export default function Home() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState("");
  const fileInputRef = useRef(null);

  const toggleScanner = () => {
    setScanning((prev) => !prev);
    if (result) setResult("");
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const decodedData = await processQrFromImage(file);
      setResult(decodedData);
      setScanning(false);
    } catch (error) {
      alert(error);
    } finally {
      event.target.value = "";
    }
  };

  return (
    <>
      <h1 className="page-title">SCAN</h1>
      <div className="title-divider"></div>

      <main className="home-main">
        <div className="scanner-container">
          <div className="corner top-left" />
          <div className="corner top-right" />
          <div className="corner bottom-left" />
          <div className="corner bottom-right" />

          {scanning ? (
            <Scanner
              onScan={(detectedCodes) => {
                if (detectedCodes && detectedCodes.length > 0) {
                  setResult(detectedCodes[0].rawValue);
                  setScanning(false);
                }
              }}
              onError={(error) => console.error("QR Scanner Error:", error)}
              components={{ finder: false, audio: true }}
              styles={{ container: { width: "100%", height: "100%" } }}
            />
          ) : (
            <div className="scan-line" />
          )}
        </div>

        {result ? (
          <div className="result-box">
            <div className="result-header">
              <LinkIcon size={16} /> <span>Scanned Result:</span>
              <button onClick={() => setResult("")} className="close-result">
                <XCircle size={18} />
              </button>
            </div>
            <p className="result-text">
              {result.startsWith("http") ? (
                <a href={result} target="_blank" rel="noopener noreferrer">
                  {result}
                </a>
              ) : (
                result
              )}
            </p>
          </div>
        ) : null}

        <div className="actions">
          <button className="scan-btn" type="button" onClick={toggleScanner}>
            {scanning ? "STOP CAMERA" : "START SCANNING"}
          </button>

          <button className="gallery-box" type="button" onClick={handleGalleryClick}>
            <i className="fa-regular fa-image" />
            <span>Select from Gallery</span>
          </button>

          <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUpload} />
        </div>
      </main>
    </>
  );
}
