
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  QrCode,
  Mail,
  Smartphone,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import "../assets/style.css";
import "./ForgotPassword.css"; 

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [status, setStatus] = useState("idle");
  const [msg, setMsg] = useState("");
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, timeLeft]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setStep(2);
        setTimeLeft(120);
        setStatus("idle");
        setMsg("");
      } else {
        setStatus("error");
        setMsg(data.message);
      }
    } catch {
      setStatus("error");
      setMsg("Lỗi kết nối Server!");
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp }),
      });
      const data = await res.json();
      if (data.success) {
        setStep(3);
        setStatus("idle");
        setMsg("");
      } else {
        setStatus("error");
        setMsg(data.message);
      }
    } catch {
      setStatus("error");
      setMsg("Lỗi kết nối Server!");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMsg("Mật khẩu xác nhận không khớp!");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setMsg("Đổi mật khẩu thành công! Trở về đăng nhập...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setStatus("error");
        setMsg(data.message);
      }
    } catch {
      setStatus("error");
      setMsg("Lỗi kết nối Server!");
    }
  };

  return (
    <div className="page-container">
      <div className="main-panel">
        <header className="top-bar">
          <div className="logo-area">
            <QrCode className="qr-svg" color="white" />
            <Link to="/" style={{ textDecoration: "none" }}>
              <span className="logo-text text-white ms-2">QR CODE</span>
            </Link>
          </div>
        </header>

        <main className="forgot-main">
          <div className="forgot-card">
            <div className="forgot-header">
              <h3>Lấy lại mật khẩu</h3>
              <p>Khôi phục quyền truy cập vào tài khoản của bạn</p>
            </div>

            {status === "error" && (
              <div className="forgot-alert error">
                <AlertCircle size={18} /> {msg}
              </div>
            )}
            {status === "success" && (
              <div className="forgot-alert success">
                <CheckCircle2 size={18} /> {msg}
              </div>
            )}

            {step === 1 && (
              <form className="forgot-form" onSubmit={handleSendOTP}>
                <div className="form-group">
                  <label>Email hoặc Số điện thoại</label>
                  <div className="forgot-input-wrap">
                    <Mail className="forgot-icon" size={18} />
                    <input
                      type="text"
                      placeholder="Nhập tài khoản của bạn"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="forgot-submit-btn"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? (
                    <div className="spinner"></div>
                  ) : (
                    "GỬI MÃ OTP"
                  )}
                </button>
              </form>
            )}

            {step === 2 && (
              <form className="forgot-form" onSubmit={handleVerifyOTP}>
                <div className="form-group">
                  <label>Nhập mã OTP (Đã gửi tới {identifier})</label>
                  <div className="forgot-input-wrap">
                    <Smartphone className="forgot-icon" size={18} />
                    <input
                      type="text"
                      placeholder="Nhập 6 số"
                      required
                      maxLength="6"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                  <small
                    className={`timer-text ${timeLeft === 0 ? "danger" : "normal"}`}
                  >
                    Thời gian còn lại: {Math.floor(timeLeft / 60)}:
                    {(timeLeft % 60).toString().padStart(2, "0")}
                  </small>
                </div>
                <button
                  type="submit"
                  className="forgot-submit-btn"
                  disabled={status === "loading" || timeLeft === 0}
                >
                  {status === "loading" ? (
                    <div className="spinner"></div>
                  ) : (
                    "XÁC NHẬN MÃ"
                  )}
                </button>
                {timeLeft === 0 && (
                  <button
                    type="button"
                    className="resend-otp-btn"
                    onClick={handleSendOTP}
                  >
                    Gửi lại mã mới
                  </button>
                )}
              </form>
            )}

            {step === 3 && (
              <form className="forgot-form" onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label>Mật khẩu mới</label>
                  <div className="forgot-input-wrap">
                    <Lock className="forgot-icon" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="forgot-toggle-pw"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Xác nhận mật khẩu</label>
                  <div className="forgot-input-wrap">
                    <Lock className="forgot-icon" size={18} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="forgot-toggle-pw"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="forgot-submit-btn"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? (
                    <div className="spinner"></div>
                  ) : (
                    "LƯU MẬT KHẨU"
                  )}
                </button>
              </form>
            )}

            <div className="forgot-prompt">
              Nhớ ra mật khẩu rồi? <Link to="/login">Đăng nhập</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
