import React, { useState } from "react";
import "./Code.css";
import "../assets/style.css";
import { QrCode, Menu, Pencil } from "lucide-react";
import { Link } from "react-router-dom";

export default function Code() {
  const [open, setOpen] = useState(false);

  return (
    <div className="page-container">
      <div className="main-panel">
        <header className="top-bar">
          <div className="logo-area">
            <QrCode className="qr-svg text-white" color="white" />
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
              <Link to="/" onClick={() => setOpen(false)}>
                Home
              </Link>
              <Link to="/about" onClick={() => setOpen(false)}>
                About
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

        <h1 className="page-title">Code</h1>
        <div className="title-divider"></div>

        <section className="card">
          <div className="card-hd">
            <span className="pencil" aria-hidden="true">
              <Pencil size={20} />
            </span>
            <span>Enter Code Manually</span>
          </div>

          <div className="card-divider"></div>

          <div className="input-wrap">
            <input type="text" placeholder="Enter verification code" />
          </div>

          <button className="primary" type="button">
            VERIFY
          </button>
        </section>
      </div>
    </div>
  );
}
