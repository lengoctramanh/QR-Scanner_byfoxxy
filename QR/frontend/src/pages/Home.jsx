import React, { useState, useRef } from "react";
import "../assets/style.css";
import "./Home.css";
import { QrCode, Menu, Camera, Link as LinkIcon, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Scanner } from "@yudiel/react-qr-scanner";
import jsQR from "jsqr";

export default function Home() {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState("");

  const fileInputRef = useRef(null);

  const toggleScanner = () => {
    setScanning(!scanning);
    if (result) setResult("");
  };

  const handleGalleryClick = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });

        const padding = 40;
        const width = img.width;
        const height = img.height;

        canvas.width = width + padding * 2;
        canvas.height = height + padding * 2;

        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.imageSmoothingEnabled = false;

        context.drawImage(img, padding, padding, width, height);

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );

        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code) {
          setResult(code.data);
          setScanning(false);
        } else {
          alert(
            "We couldn't find any QR code in this image. Please try another one!",
          );
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  return (
    <div className="page-container">
      <div className="main-panel">
        <header className="top-bar">
          <div className="logo-area">
            <QrCode className="qr-svg" color="white" />
            <Link
              style={{ textDecoration: "none" }}
              to="/"
              onClick={() => setOpen(false)}
            >
              <span className="logo-text text-white ms-2">QR CODE</span>
            </Link>
          </div>

          <div className="menu-area">
            <button className="menu-btn" onClick={() => setOpen((v) => !v)}>
              <Menu className="menu-svg" color="white" />
            </button>
            <div className={`dropdown-menu ${open ? "show" : ""}`}>
              <Link to="/about" onClick={() => setOpen(false)}>
                About
              </Link>
              <Link to="/code" onClick={() => setOpen(false)}>
                Code
              </Link>
              <Link to="/register" onClick={() => setOpen(false)}>
                Sign up
              </Link>
              <Link to="/login" onClick={() => setOpen(false)}>
                Log in
              </Link>
            </div>
          </div>
        </header>

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
                onError={(error) => console.log(error)}
                components={{ finder: false, audio: true }}
                styles={{ container: { width: "100%", height: "100%" } }}
              />
            ) : (
              <div className="scan-line" />
            )}
          </div>
          {result && (
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
          )}

          <div className="actions">
            <button className="scan-btn" type="button" onClick={toggleScanner}>
              {scanning ? "STOP CAMERA" : "START SCANNING"}
            </button>

            <button
              className="gallery-box"
              type="button"
              onClick={handleGalleryClick}
            >
              <i className="fa-regular fa-image" />
              <span>Select from Gallery</span>
            </button>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
