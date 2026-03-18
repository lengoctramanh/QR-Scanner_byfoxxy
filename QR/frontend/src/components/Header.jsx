// src/components/Header.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { QrCode, Menu } from "lucide-react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="top-bar">
      <div className="logo-area">
        <QrCode className="qr-svg text-white" color="white" />
        <Link style={{ textDecoration: "none" }} to="/" onClick={() => setOpen(false)}>
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
  );
}
