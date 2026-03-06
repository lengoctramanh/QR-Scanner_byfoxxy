import React, { useState, useEffect } from "react";
import {
  QrCode,
  Menu,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  LogIn,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "../assets/style.css";
import "./Login.css";

const welcomeTexts = [
  "manage your brand & products.",
  "track your orders & history.",
  "connect with global partners.",
];

export default function Login() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const [loginMethod, setLoginMethod] = useState("password"); 
  const [identifier, setIdentifier] = useState(""); 
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [status, setStatus] = useState("idle"); 
  const [errorMessage, setErrorMessage] = useState("");

  const isFormValid =
    loginMethod === "password"
      ? identifier.trim() !== "" && password.trim() !== ""
      : identifier.trim() !== "" && otp.trim() !== "";


  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % welcomeTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setStatus("loading");
    setErrorMessage("");

    setTimeout(() => {
      if (identifier === "error") {
        setStatus("error");
        setErrorMessage(
          "Account not found or email is not verified. Please check again.",
        );
        return;
      }

      if (password === "wrong") {
        setStatus("error");
        setErrorMessage(
          "Incorrect password. Please try again or click Forgot Password.",
        );
        return;
      }

      setStatus("success");
      setTimeout(() => {
        navigate("/");
      }, 1000);
    }, 1500);
  };

  return (
    <div className="page-container">
      <div className="main-panel">
        <header className="top-bar">
          <div className="logo-area">
            <QrCode className="qr-svg" color="white" />
            <span className="logo-text text-white ms-2">QR CODE</span>
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
            </div>
          </div>
        </header>

        <main className="login-main">
          <div className="login-card">
            <div className="login-banner">
              <div className="banner-content">
                <h2>Welcome Back!</h2>
                <p>
                  Sign in to <strong>{welcomeTexts[textIndex]}</strong>
                </p>
              </div>
              <div className="banner-graphic">
                <div className="circle c1"></div>
                <div className="circle c2"></div>
                <QrCode size={100} className="banner-qr" />
              </div>
            </div>

            <div className="login-form-container">
              <div className="login-header">
                <h3>Sign In</h3>
                <p>Enter your details to access your account.</p>
              </div>

              <div className="login-method-toggle">
                <button
                  type="button"
                  className={loginMethod === "password" ? "active" : ""}
                  onClick={() => {
                    setLoginMethod("password");
                    setStatus("idle");
                  }}
                >
                  Password
                </button>
                <button
                  type="button"
                  className={loginMethod === "otp" ? "active" : ""}
                  onClick={() => {
                    setLoginMethod("otp");
                    setStatus("idle");
                  }}
                >
                  Send OTP
                </button>
              </div>

              {status === "error" && (
                <div className="msg-alert error">
                  <AlertCircle size={18} /> <span>{errorMessage}</span>
                </div>
              )}
              {status === "success" && (
                <div className="msg-alert success">
                  <CheckCircle2 size={18} />{" "}
                  <span>Login successful! Redirecting...</span>
                </div>
              )}

              <form className="login-form" onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Email or Phone Number</label>
                  <div className="input-icon-wrap">
                    <Mail className="input-icon" size={18} />
                    <input
                      type="text"
                      placeholder="Enter email or phone"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setStatus("idle");
                      }}
                    />
                  </div>
                </div>

                {loginMethod === "password" ? (
                  <div className="form-group">
                    <label>Password</label>
                    <div className="input-icon-wrap">
                      <Lock className="input-icon" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setStatus("idle");
                        }}
                      />
                      <button
                        type="button"
                        className="toggle-pw-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="form-group slide-in">
                    <label>One-Time Password (OTP)</label>
                    <div className="input-icon-wrap">
                      <Smartphone className="input-icon" size={18} />
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value);
                          setStatus("idle");
                        }}
                        maxLength="6"
                      />
                      <button type="button" className="get-otp-btn">
                        Get OTP
                      </button>
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  <label className="remember-me">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Remember me
                  </label>
                  <a href="#" className="forgot-pw">
                    Forgot Password?
                  </a>
                </div>

                <button
                  type="submit"
                  className={`submit-login-btn ${status === "loading" ? "loading" : ""}`}
                  disabled={!isFormValid || status === "loading"}
                >
                  {status === "loading" ? (
                    <div className="spinner"></div>
                  ) : (
                    <>
                      SIGN IN <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <div className="social-login-divider">
                  <span>OR CONTINUE WITH</span>
                </div>

                <div className="social-buttons">
                  <button type="button" className="btn-social google">
                    <i className="fa-brands fa-google"></i> Google
                  </button>
                  <button type="button" className="btn-social apple">
                    <i className="fa-brands fa-apple"></i> Apple
                  </button>
                </div>

                <div className="register-prompt">
                  Don't have an account?{" "}
                  <Link to="/register">Create one now</Link>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
