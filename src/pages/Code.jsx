import React, { useState } from "react";
import "./Code.css";
import { QrCode, Menu } from "lucide-react";
import { Link } from "react-router-dom";

export default function Code() {
  const [open, setOpen] = useState(false);

  return (
    <div className="web">
      <div className="panel">
        {/* Header */}
        <header className="topbar">
          <div className="top-left">
            <div className="qr-icon" aria-hidden="true">
              <QrCode className="qr-svg" />
            </div>
            <div className="top-title">QR CODE</div>
          </div>

          {/* MENU AREA + DROPDOWN */}
          <div className="menu-area">
            <button
              className="burger"
              aria-label="Menu"
              type="button"
              onClick={() => setOpen((v) => !v)}
            >
              <Menu className="menu-svg" />
            </button>

            <div className={`dropdown-menu-custom ${open ? "show" : ""}`}>
              <Link to="/about" onClick={() => setOpen(false)}>About</Link>
              <Link to="/" onClick={() => setOpen(false)}>Home</Link>
            </div>
          </div>
        </header>

        {/* Title */}
        <h1 className="page-title">Code</h1>
        <div className="title-divider"></div>

        {/* Card */}
        <section className="card">
          <div className="card-hd">
            <span className="pencil" aria-hidden="true">✎</span>
            <span>Enter Code Manually</span>
          </div>

          <div className="card-divider"></div>

          <div className="input-wrap">
            <input type="text" placeholder="Enter verification code" />
          </div>

          <button className="primary" type="button">VERIFY</button>
        </section>
      </div>
    </div>
  );
}