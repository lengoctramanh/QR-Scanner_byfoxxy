import React, { useState } from "react";
import { QrCode, Menu, Info, Tag, Users, Shield, Handshake, Mail } from "lucide-react";
import { Link } from "react-router-dom";

import "./About.css";

export default function About() {
  const [open, setOpen] = useState(false);

  return (
    <div className="about-page">
      {/* TOP BAR */}
      <header className="top-bar">
        <div className="logo-area">
          <QrCode className="qr-logo" />
          <span className="logo-text">QR CODE</span>
        </div>

        <div className="menu-area">
            
          <button
            className="menu-btn"
            type="button"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu />
          </button>

          <div className={`dropdown-menu-custom ${open ? "show" : ""}`}>
            <Link to="/" onClick={() => setOpen(false)}>Home</Link>
            <Link to="/code" onClick={() => setOpen(false)}>Code</Link>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="about-main">
        <div className="about-title-wrapper">
          <h2 className="about-title">
            <Info className="title-icon" />
            ABOUT US
          </h2>
        </div>

        <div className="about-card">
          {/* Version */}
          <div className="info-section">
            <h5 className="section-title">
              <Tag size={18} />
              Version
            </h5>
            <p className="section-text">1.0.0</p>
          </div>

          <hr />

          {/* User Policies */}
          <div className="info-section">
            <h5 className="section-title">
              <Users size={18} />
              User Policies
            </h5>

            <ul className="policy-list">
              <li><strong>1. Respect:</strong> Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li>
              <li><strong>2. Privacy First:</strong> Fusce dapibus, tellus ac cursus commodo, tortor mauris.</li>
              <li><strong>3. Data Security:</strong> Vestibulum id ligula porta felis euismod semper.</li>
              <li><strong>4. Fair Use:</strong> Nullam quis risus eget urna mollis ornare vel eu leo.</li>
              <li><strong>5. Compliance:</strong> Aenean eu leo quam. Pellentesque ornare sem lacinia quam.</li>
            </ul>
          </div>

          <hr />

          {/* Privacy Policy */}
          <div className="info-section">
            <h5 className="section-title">
              <Shield size={18} />
              Privacy Policy
            </h5>
            <p className="muted">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet.
              Maecenas sed diam eget risus varius blandit sit amet non magna. Donec id elit non mi porta gravida at eget metus.
            </p>
          </div>

          <hr />

          {/* Our Commitment */}
          <div className="info-section">
            <h5 className="section-title">
              <Handshake size={18} />
              Our Commitment
            </h5>
            <p className="muted">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
            </p>
            <p className="muted">
              Curabitur blandit tempus porttitor. Aenean lacinia bibendum nulla sed consectetur. Cras mattis consectetur purus sit amet fermentum.
            </p>
            <p className="muted">
              Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.
            </p>
          </div>

          <hr />

          {/* Support */}
          <div className="info-section center">
            <h5 className="section-title help-title">Need Help?</h5>

            <a href="mailto:thanhtuan231005@gmail.com" className="support-btn">
              <Mail size={18} />
              Contact Support
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}