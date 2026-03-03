import React, { useState } from "react";
import "./Home.css";
import { QrCode,Menu, Camera} from "lucide-react";
import { Link } from "react-router-dom";
export default function Home() {
  const [open, setOpen] = useState(false);

  return (
    <div className="web">
      <div className="panel">
        <header className="top-bar">
          <div className="logo-area">
            <i className="fa-solid fa-qrcode text-white" />
             <QrCode className="qr-svg"/>
            <span className="logo-text text-white ms-2">QR CODE</span>
          </div>

          <div className="menu-area">
  <button
    className="menu-btn"
    onClick={() => setOpen((v) => !v)}
  >
    <Menu className="menu-svg" />
  </button>
<div className={`dropdown-menu-custom ${open ? "show" : ""}`}>
  <Link to="/about" onClick={() => setOpen(false)}>About</Link>
  <Link to="/code" onClick={() => setOpen(false)}>Code</Link>
</div>
</div>
        </header>

        {/* Title giống About */}
        <h1 className="page-title">SCAN</h1>
        <div className="title-divider"></div>

        <main className="home-main">
          <div className="scanner-container">
            <div className="corner top-left" />
            <div className="corner top-right" />
            <div className="corner bottom-left" />
            <div className="corner bottom-right" />
            <div className="scan-line" />
          </div>

          {/* 2 nút nằm giữa dưới camera */}
          <div className="actions">
            <button className="btn scan-btn" type="button">SCAN NOW</button>

            <button className="gallery-box" type="button">
              <i className="fa-regular fa-image" />
              <Camera size={32} color="black" strokeWidth={2} />
              <span>Select from Gallery</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}