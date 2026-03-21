import { Eye, EyeOff, Lock, Mail, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import useForgotPassword from "../hooks/useForgotPassword";
import "./ForgotPassword.css";

// Ham nay dung de render trang quen mat khau va hien thi tung buoc khoi phuc tai khoan.
// Nhan vao: khong nhan props, su dung state/handler tu useForgotPassword.
// Tra ve: giao dien gui OTP, xac minh OTP va dat lai mat khau.
export default function ForgotPassword() {
  const { step, identifier, otp, newPassword, confirmPassword, showPassword, showConfirmPassword, status, message, timeLeft, setIdentifier, setOtp, setNewPassword, setConfirmPassword, toggleShowPassword, toggleShowConfirmPassword, handleSendOtp, handleVerifyOtp, handleResetPassword } =
    useForgotPassword();

  return (
    <main className="forgot-main">
      <div className="forgot-card">
        <div className="forgot-header">
          <h3>Reset Password</h3>
          <p>Follow the steps to recover your account</p>
        </div>

        {message ? (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 14px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              background: status === "error" ? "#feeced" : "#eaf4ff",
              color: status === "error" ? "#d92d20" : "#2b5c8f",
              border: status === "error" ? "1px solid #f9c2c4" : "1px solid #cfe2ff",
            }}>
            {message}
          </div>
        ) : null}

        {step === 1 ? (
          <form className="forgot-form" onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Enter your email or phone</label>
              <div className="forgot-input-wrap">
                <Mail className="forgot-icon" size={18} />
                <input type="text" placeholder="Enter your email or phone" required value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
              </div>
            </div>

            <button type="submit" className="forgot-submit-btn" disabled={status === "loading"}>
              {status === "loading" ? <div className="spinner"></div> : "SEND OTP"}
            </button>
          </form>
        ) : null}

        {step === 2 ? (
          <form className="forgot-form" onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label>Verification Code (sent to {identifier})</label>
              <div className="forgot-input-wrap">
                <Smartphone className="forgot-icon" size={18} />
                <input type="text" placeholder="6-digit code" required maxLength="6" value={otp} onChange={(event) => setOtp(event.target.value)} />
              </div>

              <small className={`timer-text ${timeLeft === 0 ? "danger" : "normal"}`}>
                Time remaining: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </small>
            </div>

            <button type="submit" className="forgot-submit-btn" disabled={status === "loading" || timeLeft === 0}>
              {status === "loading" ? <div className="spinner"></div> : "VERIFY CODE"}
            </button>

            {timeLeft === 0 ? (
              <button type="button" className="resend-otp-btn" onClick={handleSendOtp}>
                Resend Code
              </button>
            ) : null}
          </form>
        ) : null}

        {step === 3 ? (
          <form className="forgot-form" onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>New Password</label>
              <div className="forgot-input-wrap">
                <Lock className="forgot-icon" size={18} />
                <input type={showPassword ? "text" : "password"} placeholder="........" required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                <button type="button" className="forgot-toggle-pw" onClick={toggleShowPassword}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <div className="forgot-input-wrap">
                <Lock className="forgot-icon" size={18} />
                <input type={showConfirmPassword ? "text" : "password"} placeholder="........" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                <button type="button" className="forgot-toggle-pw" onClick={toggleShowConfirmPassword}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="forgot-submit-btn" disabled={status === "loading"}>
              {status === "loading" ? <div className="spinner"></div> : "RESET PASSWORD"}
            </button>
          </form>
        ) : null}

        <div className="forgot-prompt">
          Remember your password? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </main>
  );
}
