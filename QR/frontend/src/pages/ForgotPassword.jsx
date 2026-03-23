import { Mail, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import ResetPasswordForm from "../components/auth/ResetPasswordForm";
import useForgotPassword from "../hooks/useForgotPassword";
import "./ForgotPassword.css";

// Ham nay dung de render trang quen mat khau va hien thi tung buoc khoi phuc tai khoan.
// Nhan vao: khong nhan props, su dung state/handler tu useForgotPassword.
// Tra ve: giao dien gui OTP, xac minh OTP va dat lai mat khau.
export default function ForgotPassword() {
  const { step, identifier, otp, newPassword, confirmPassword, deliveryHint, status, message, timeLeft, setIdentifier, setOtp, setNewPassword, setConfirmPassword, handleSendOtp, handleResendOtp, handleVerifyOtp, handleResetPassword } =
    useForgotPassword();

  const verificationLabel = deliveryHint ? `Verification Code (sent to ${deliveryHint})` : "Verification Code";

  return (
    <main className="forgot-main">
      <div className="forgot-card">
        <div className="forgot-header">
          <h3>Reset Password</h3>
          <p>Follow the steps to recover your account</p>
        </div>

        {message ? <div className={`forgot-alert ${status === "error" ? "error" : status === "success" ? "success" : "info"}`}>{message}</div> : null}

        {step === 1 ? (
          <form className="forgot-form" onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Enter your email or phone</label>
              <div className="forgot-input-wrap">
                <Mail className="forgot-icon" size={18} />
                <input type="text" placeholder="Enter your email or phone" required value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
              </div>
              <small className="forgot-meta-text">We will send a 6-digit verification code if the account can be recovered.</small>
            </div>

            <button type="submit" className="forgot-submit-btn" disabled={status === "loading"}>
              {status === "loading" ? <div className="spinner"></div> : "SEND OTP"}
            </button>
          </form>
        ) : null}

        {step === 2 ? (
          <form className="forgot-form" onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label>{verificationLabel}</label>
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
              <button type="button" className="resend-otp-btn" onClick={handleResendOtp} disabled={status === "loading"}>
                Resend Code
              </button>
            ) : null}
          </form>
        ) : null}

        {step === 3 ? (
          <ResetPasswordForm
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            onNewPasswordChange={setNewPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onSubmit={handleResetPassword}
            isSubmitting={status === "loading" || status === "success"}
          />
        ) : null}

        <div className="forgot-prompt">
          Remember your password? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </main>
  );
}
